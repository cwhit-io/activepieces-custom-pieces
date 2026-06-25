import {
	AuthenticationType,
	httpClient,
	HttpMessageBody,
	HttpMethod,
	HttpResponse,
	QueryParams,
} from '@activepieces/pieces-common';

const BASE_URL = 'https://api.planningcenteronline.com';
const USER_AGENT =
	'Activepieces Planning Center Services (https://activepieces.com)';
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
	return {
		id: resource.id,
		type: resource.type,
		...flattened,
	};
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

async function paginatedApiCall({
	credentials,
	path,
	queryParams,
}: {
	credentials: PlanningCenterCredentials;
	path: string;
	queryParams?: Record<string, string>;
}): Promise<JsonApiResource[]> {
	const resources: JsonApiResource[] = [];
	let offset = 0;
	let hasMore = true;

	while (hasMore) {
		const response = await apiCall<JsonApiListResponse>({
			credentials,
			method: HttpMethod.GET,
			path,
			queryParams: {
				...queryParams,
				per_page: String(DEFAULT_PER_PAGE),
				offset: String(offset),
			},
		});

		const pageResources = response.body.data ?? [];
		resources.push(...pageResources);

		const totalCount = response.body.meta?.total_count;
		if (typeof totalCount === 'number') {
			offset += pageResources.length;
			hasMore = offset < totalCount;
			continue;
		}

		hasMore = Boolean(response.body.links?.next) && pageResources.length > 0;
		offset += pageResources.length;
	}

	return resources;
}

async function listResources({
	credentials,
	path,
	queryParams,
	fetchAll,
}: {
	credentials: PlanningCenterCredentials;
	path: string;
	queryParams?: Record<string, string>;
	fetchAll: boolean;
}): Promise<Record<string, unknown>[]> {
	const resources = fetchAll
		? await paginatedApiCall({ credentials, path, queryParams })
		: (
				await apiCall<JsonApiListResponse>({
					credentials,
					method: HttpMethod.GET,
					path,
					queryParams,
				})
			).body.data ?? [];

	return flattenJsonApiCollection(resources);
}

function credentialsFromAuthProps(
	props: Record<string, unknown>,
): PlanningCenterCredentials {
	const applicationId = props['application_id'];
	const secret = props['secret'];

	if (typeof applicationId !== 'string' || typeof secret !== 'string') {
		throw new Error('Missing Planning Center credentials on the connection.');
	}

	return {
		applicationId,
		secret,
	};
}

export const planningCenterClient = {
	apiCall,
	paginatedApiCall,
	listResources,
	flattenJsonApiResource,
	flattenJsonApiCollection,
	getStringAttribute,
	credentialsFromAuthProps,
	BASE_URL,
};

export type PlanningCenterCredentials = {
	applicationId: string;
	secret: string;
};

type JsonApiResource = {
	type: string;
	id: string;
	attributes?: Record<string, unknown>;
	relationships?: Record<string, unknown>;
};

type JsonApiListResponse = {
	data?: JsonApiResource[];
	links?: {
		next?: string;
	};
	meta?: {
		total_count?: number;
	};
};

