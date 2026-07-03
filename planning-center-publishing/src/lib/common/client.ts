import {
	AuthenticationType,
	httpClient,
	HttpMessageBody,
	HttpMethod,
	HttpResponse,
	QueryParams,
} from '@activepieces/pieces-common';

const BASE_URL = 'https://api.planningcenteronline.com';
const USER_AGENT = 'Activepieces Planning Center Publishing (https://activepieces.com)';
const DEFAULT_PER_PAGE = 100;

function flattenValue(value: unknown, prefix: string): Record<string, unknown> {
	if (value === null || value === undefined) {
		return { [prefix]: null };
	}
	if (Array.isArray(value)) {
		const parts = value.map((item) => {
			if (typeof item === 'object' && item !== null) {
				return JSON.stringify(item);
			}
			return String(item);
		});
		return { [prefix]: parts.join(', ') };
	}
	if (typeof value === 'object') {
		return flattenObject(value as Record<string, unknown>, prefix);
	}
	return { [prefix]: value };
}

function flattenObject(
	obj: Record<string, unknown>,
	prefix = '',
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(obj)) {
		const flatKey = prefix ? `${prefix}_${key}` : key;
		Object.assign(result, flattenValue(value, flatKey));
	}
	return result;
}

function flattenJsonApiResource(
	resource: JsonApiResource,
): Record<string, unknown> {
	const flattened = flattenObject(resource.attributes ?? {}, '');
	return { id: resource.id, type: resource.type, ...flattened };
}

function flattenJsonApiCollection(
	resources: JsonApiResource[],
): Record<string, unknown>[] {
	return resources.map((resource) => flattenJsonApiResource(resource));
}

function getStringAttribute(
	resource: JsonApiResource,
	attributeName: string,
): string | null {
	const value = resource.attributes?.[attributeName];
	return typeof value === 'string' ? value : null;
}

async function apiCall<T extends HttpMessageBody>({
	credentials,
	method,
	path,
	body,
	queryParams,
}: {
	credentials: PlanningCenterCredentials;
	method: HttpMethod;
	path: string;
	body?: unknown;
	queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
	const query: QueryParams = {};
	if (queryParams) {
		for (const [key, value] of Object.entries(queryParams)) {
			query[key] = value;
		}
	}
	return await httpClient.sendRequest<T>({
		method,
		url: `${BASE_URL}${path}`,
		authentication: {
			type: AuthenticationType.BASIC,
			username: credentials.applicationId,
			password: credentials.secret,
		},
		headers: {
			'User-Agent': USER_AGENT,
			'Content-Type': 'application/json',
		},
		queryParams: query,
		body,
	});
}

function resolvePerPage({
	queryParams,
	maxResults,
}: {
	queryParams?: Record<string, string>;
	maxResults?: number;
}): number {
	const requested = queryParams?.['per_page']
		? Number(queryParams['per_page'])
		: undefined;
	if (requested && requested > 0) {
		return Math.min(requested, DEFAULT_PER_PAGE);
	}
	if (maxResults && maxResults > 0) {
		return Math.min(maxResults, DEFAULT_PER_PAGE);
	}
	return DEFAULT_PER_PAGE;
}

function parseFilterTimestamp(value: unknown): number | null {
	if (typeof value !== 'string' || value.length === 0) {
		return null;
	}
	const timestamp = Date.parse(value);
	return Number.isNaN(timestamp) ? null : timestamp;
}

function compareFilterValues(
	left: unknown,
	right: unknown,
): number {
	const leftTimestamp = parseFilterTimestamp(left);
	const rightTimestamp = parseFilterTimestamp(right);
	if (leftTimestamp !== null && rightTimestamp !== null) {
		return leftTimestamp - rightTimestamp;
	}
	if (typeof left === 'number' && typeof right === 'number') {
		return left - right;
	}
	return String(left ?? '').localeCompare(String(right ?? ''));
}

function applyClientFilters(
	items: Record<string, unknown>[],
	filters?: ClientFilters,
): Record<string, unknown>[] {
	if (!filters) {
		return items;
	}

	let result = items;
	const hasDateFilter = Boolean(filters.startDate ?? filters.endDate);

	if (hasDateFilter) {
		const startTs = filters.startDate
			? parseFilterTimestamp(filters.startDate)
			: null;
		const endTs = filters.endDate
			? parseFilterTimestamp(filters.endDate)
			: null;

		result = result.filter((item) => {
			const itemTs = parseFilterTimestamp(item[filters.dateField]);
			if (itemTs === null) {
				return false;
			}
			if (startTs !== null && itemTs < startTs) {
				return false;
			}
			if (endTs !== null && itemTs > endTs) {
				return false;
			}
			return true;
		});
	}

	if (filters.sortField && filters.sortDirection) {
		const direction = filters.sortDirection === 'desc' ? -1 : 1;
		result = [...result].sort(
			(left, right) =>
				direction *
				compareFilterValues(
					left[filters.sortField],
					right[filters.sortField],
				),
		);
	}

	return result;
}

function includedResourceKey(resource: JsonApiResource): string {
	return `${resource.type}:${resource.id}`;
}

function mergeIncludedResources({
	existing,
	pageIncluded,
}: {
	existing: JsonApiResource[];
	pageIncluded?: JsonApiResource[];
}): JsonApiResource[] {
	if (!pageIncluded?.length) {
		return existing;
	}
	const seen = new Set(existing.map(includedResourceKey));
	const merged = [...existing];
	for (const resource of pageIncluded) {
		const key = includedResourceKey(resource);
		if (!seen.has(key)) {
			seen.add(key);
			merged.push(resource);
		}
	}
	return merged;
}

function buildPaginatedListResponse({
	data,
	included,
	meta,
}: {
	data: JsonApiResource[];
	included: JsonApiResource[];
	meta: JsonApiListResponse['meta'];
}): JsonApiListResponse {
	const response: JsonApiListResponse = {
		data,
		meta,
		links: {},
	};
	if (included.length > 0) {
		response.included = included;
	}
	return response;
}

async function paginatedJsonApiListResponse({
	credentials,
	path,
	queryParams,
	maxResults,
}: {
	credentials: PlanningCenterCredentials;
	path: string;
	queryParams?: Record<string, string>;
	maxResults?: number;
}): Promise<JsonApiListResponse> {
	const resources: JsonApiResource[] = [];
	let included: JsonApiResource[] = [];
	let offset = 0;
	let hasMore = true;
	const perPage = resolvePerPage({ queryParams, maxResults });
	let lastMeta: JsonApiListResponse['meta'];
	const queryWithoutOffset = { ...queryParams };
	delete queryWithoutOffset['offset'];

	while (hasMore) {
		const response = await apiCall<JsonApiListResponse>({
			credentials,
			method: HttpMethod.GET,
			path,
			queryParams: {
				...queryWithoutOffset,
				per_page: String(perPage),
				offset: String(offset),
			},
		});
		const pageResources = response.body.data ?? [];
		resources.push(...pageResources);
		included = mergeIncludedResources({
			existing: included,
			pageIncluded: response.body.included,
		});
		lastMeta = response.body.meta;

		if (maxResults && resources.length >= maxResults) {
			return buildPaginatedListResponse({
				data: resources.slice(0, maxResults),
				included,
				meta: lastMeta,
			});
		}

		const totalCount = response.body.meta?.total_count;
		if (typeof totalCount === 'number') {
			offset += pageResources.length;
			hasMore = offset < totalCount;
			continue;
		}
		hasMore = Boolean(response.body.links?.next) && pageResources.length > 0;
		offset += pageResources.length;
	}

	return buildPaginatedListResponse({
		data: resources,
		included,
		meta: lastMeta,
	});
}

async function paginatedApiCall({
	credentials,
	path,
	queryParams,
	maxResults,
}: {
	credentials: PlanningCenterCredentials;
	path: string;
	queryParams?: Record<string, string>;
	maxResults?: number;
}): Promise<JsonApiResource[]> {
	const response = await paginatedJsonApiListResponse({
		credentials,
		path,
		queryParams,
		maxResults,
	});
	return response.data ?? [];
}

async function listResources({
	credentials,
	path,
	queryParams,
	fetchAll,
	maxResults,
	clientFilters,
}: {
	credentials: PlanningCenterCredentials;
	path: string;
	queryParams?: Record<string, string>;
	fetchAll: boolean;
	maxResults?: number;
	clientFilters?: ClientFilters;
}): Promise<Record<string, unknown>[]> {
	const resources = fetchAll
		? await paginatedApiCall({ credentials, path, queryParams, maxResults })
		: (
				await apiCall<JsonApiListResponse>({
					credentials,
					method: HttpMethod.GET,
					path,
					queryParams,
				})
			).body.data ?? [];

	const collection = applyClientFilters(
		flattenJsonApiCollection(resources),
		clientFilters,
	);
	return maxResults ? collection.slice(0, maxResults) : collection;
}

function credentialsFromAuthProps(
	props: Record<string, unknown>,
): PlanningCenterCredentials {
	const applicationId = props['application_id'];
	const secret = props['secret'];
	if (typeof applicationId !== 'string' || typeof secret !== 'string') {
		throw new Error('Missing Planning Center credentials on the connection.');
	}
	return { applicationId, secret };
}

export const planningCenterClient = {
	apiCall,
	paginatedApiCall,
	paginatedJsonApiListResponse,
	listResources,
	flattenJsonApiResource,
	flattenJsonApiCollection,
	getStringAttribute,
	credentialsFromAuthProps,
	BASE_URL,
	DEFAULT_PER_PAGE,
};

export type PlanningCenterCredentials = {
	applicationId: string;
	secret: string;
};

export type ClientFilters = {
	dateField: string;
	startDate?: string;
	endDate?: string;
	sortField: string;
	sortDirection?: string;
};

type JsonApiResource = {
	type: string;
	id: string;
	attributes?: Record<string, unknown>;
};

type JsonApiListResponse = {
	data?: JsonApiResource[];
	included?: JsonApiResource[];
	links?: { next?: string };
	meta?: { total_count?: number };
};
