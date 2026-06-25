import {
	httpClient,
	HttpMessageBody,
	HttpMethod,
	HttpResponse,
	QueryParams,
} from '@activepieces/pieces-common';

const BASE_URL = 'https://api.sermonshots.com';
const DEFAULT_PAGE_LIMIT = 100;

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

function flattenRecord(record: Record<string, unknown>): Record<string, unknown> {
	return flattenObject(record, '');
}

function flattenRecords(
	records: Record<string, unknown>[],
): Record<string, unknown>[] {
	return records.map((record) => flattenRecord(record));
}

function flattenRelatedContent(
	body: Record<string, unknown>,
): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	if (body['summary'] && typeof body['summary'] === 'object') {
		Object.assign(
			result,
			flattenObject(body['summary'] as Record<string, unknown>, 'summary'),
		);
	}

	if (body['blog'] && typeof body['blog'] === 'object') {
		Object.assign(
			result,
			flattenObject(body['blog'] as Record<string, unknown>, 'blog'),
		);
	}

	if (body['discussionGuide'] && typeof body['discussionGuide'] === 'object') {
		Object.assign(
			result,
			flattenObject(
				body['discussionGuide'] as Record<string, unknown>,
				'discussion_guide',
			),
		);
	}

	if (body['transcription'] && typeof body['transcription'] === 'object') {
		Object.assign(
			result,
			flattenObject(
				body['transcription'] as Record<string, unknown>,
				'transcription',
			),
		);
	}

	if (Array.isArray(body['devotionals'])) {
		result['devotionals'] = flattenRecords(
			body['devotionals'] as Record<string, unknown>[],
		);
	}

	if (Array.isArray(body['quotes'])) {
		result['quotes'] = flattenRecords(body['quotes'] as Record<string, unknown>[]);
	}

	if (Array.isArray(body['titles'])) {
		result['titles'] = flattenRecords(body['titles'] as Record<string, unknown>[]);
	}

	return result;
}

async function apiCall<T extends HttpMessageBody>({
	authToken,
	method,
	path,
	body,
	queryParams,
	includeAuth = true,
}: {
	authToken?: string;
	method: HttpMethod;
	path: string;
	body?: unknown;
	queryParams?: Record<string, string | number | boolean>;
	includeAuth?: boolean;
}): Promise<HttpResponse<T>> {
	const query: QueryParams = {};

	if (queryParams) {
		for (const [key, value] of Object.entries(queryParams)) {
			query[key] = String(value);
		}
	}

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
	};

	if (includeAuth && authToken) {
		headers['auth-token'] = authToken;
	}

	return await httpClient.sendRequest<T>({
		method,
		url: `${BASE_URL}${path}`,
		headers,
		queryParams: query,
		body,
	});
}

function tokenFromAuth(auth: { secret_text: string }): string {
	return auth.secret_text;
}

async function listVideos({
	authToken,
	page,
	limit,
	sort,
	fetchAll,
}: {
	authToken: string;
	page?: number;
	limit?: number;
	sort?: string;
	fetchAll: boolean;
}): Promise<{
	videos: Record<string, unknown>[];
	total: number;
	page: number;
	limit: number;
}> {
	if (!fetchAll) {
		const response = await apiCall<VideosListResponse>({
			authToken,
			method: HttpMethod.GET,
			path: '/api/v1/videos',
			queryParams: {
				page: page ?? 1,
				limit: limit ?? 10,
				...(sort ? { sort } : {}),
			},
		});

		return {
			videos: flattenRecords(response.body.data ?? []),
			total: response.body.total ?? 0,
			page: response.body.page ?? page ?? 1,
			limit: response.body.limit ?? limit ?? 10,
		};
	}

	const allVideos: Record<string, unknown>[] = [];
	let currentPage = 1;
	const pageLimit = limit ?? DEFAULT_PAGE_LIMIT;
	let total = 0;

	while (true) {
		const response = await apiCall<VideosListResponse>({
			authToken,
			method: HttpMethod.GET,
			path: '/api/v1/videos',
			queryParams: {
				page: currentPage,
				limit: pageLimit,
				...(sort ? { sort } : {}),
			},
		});

		const pageVideos = response.body.data ?? [];
		allVideos.push(...flattenRecords(pageVideos));
		total = response.body.total ?? allVideos.length;

		if (pageVideos.length === 0 || allVideos.length >= total) {
			break;
		}

		currentPage += 1;
	}

	return {
		videos: allVideos,
		total,
		page: 1,
		limit: allVideos.length,
	};
}

async function fetchVideoOptions({
	authToken,
}: {
	authToken: string;
}): Promise<{ label: string; value: string }[]> {
	const response = await apiCall<VideosListResponse>({
		authToken,
		method: HttpMethod.GET,
		path: '/api/v1/videos',
		queryParams: {
			page: 1,
			limit: DEFAULT_PAGE_LIMIT,
			sort: 'DESC',
		},
	});

	return (response.body.data ?? []).map((video) => {
		const videoName = video['name'];
		const videoId = video['id'];
		const name =
			typeof videoName === 'string' && videoName.length > 0
				? videoName
				: `Video ${videoId}`;
		return {
			label: `${name} (${videoId})`,
			value: String(videoId),
		};
	});
}

export const sermonshotsClient = {
	apiCall,
	tokenFromAuth,
	flattenRecord,
	flattenRecords,
	flattenRelatedContent,
	listVideos,
	fetchVideoOptions,
	BASE_URL,
};

type VideosListResponse = {
	data?: Record<string, unknown>[];
	total?: number;
	page?: number;
	limit?: number;
};