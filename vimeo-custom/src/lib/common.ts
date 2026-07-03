import {
	AuthenticationType,
	HttpError,
	httpClient,
	HttpMethod,
} from '@activepieces/pieces-common';
import {
	AppConnectionValueForAuthProperty,
	Property,
} from '@activepieces/pieces-framework';
import { vimeoAuth } from './auth';

const BASE_URL = 'https://api.vimeo.com';
const API_ACCEPT = 'application/vnd.vimeo.*+json;version=3.4';

export type VimeoAuthProps = AppConnectionValueForAuthProperty<typeof vimeoAuth>;

type VimeoListItem = {
	uri: string;
	name: string;
};

type VimeoListResponse = {
	data?: VimeoListItem[];
};

type VimeoErrorBody = {
	error?: string;
	error_description?: string;
	description?: string;
	message?: string;
};

export async function apiRequest({
	auth,
	path,
	method = HttpMethod.GET,
	body,
	queryParams,
}: {
	auth: VimeoAuthProps;
	path: string;
	method?: HttpMethod;
	body?: unknown;
	queryParams?: Record<string, string>;
}) {
	const headers: Record<string, string> = {
		Accept: API_ACCEPT,
	};

	if (body) {
		if (body instanceof FormData) {
			headers['Content-Type'] = 'multipart/form-data';
		} else if (typeof body === 'object' && body !== null) {
			headers['Content-Type'] = 'application/json';
		}
	}

	try {
		return await httpClient.sendRequest({
			method,
			url: `${BASE_URL}${path}`,
			body,
			queryParams,
			timeout: 30000,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: auth.access_token,
			},
			headers,
		});
	} catch (error) {
		throw formatVimeoError(error);
	}
}

function isHttpError(error: unknown): error is HttpError {
	return (
		typeof error === 'object' &&
		error !== null &&
		'response' in error &&
		'errorMessage' in error
	);
}

function readVimeoErrorBody(body: unknown): VimeoErrorBody | undefined {
	if (typeof body !== 'object' || body === null) {
		return undefined;
	}

	const result: VimeoErrorBody = {};

	if ('error' in body && typeof body.error === 'string') {
		result.error = body.error;
	}
	if (
		'error_description' in body &&
		typeof body.error_description === 'string'
	) {
		result.error_description = body.error_description;
	}
	if ('description' in body && typeof body.description === 'string') {
		result.description = body.description;
	}
	if ('message' in body && typeof body.message === 'string') {
		result.message = body.message;
	}

	return result;
}

function formatVimeoError(error: unknown): Error {
	if (isHttpError(error)) {
		const responseBody = readVimeoErrorBody(error.response?.body);
		const vimeoError = responseBody?.error;
		if (vimeoError) {
			const description =
				responseBody?.error_description ??
				responseBody?.description ??
				responseBody?.message ??
				vimeoError;
			return new Error(`Vimeo API error: ${description}`);
		}

		const statusCode = error.response?.status;
		if (statusCode === 429) {
			return new Error('Rate limit exceeded. Please try again later.');
		}
		if (statusCode === 401) {
			return new Error(
				'Authentication failed. Reconnect Vimeo and ensure video_files scope is granted.',
			);
		}
		if (statusCode === 404) {
			return new Error('Resource not found.');
		}
	}

	if (error instanceof Error) {
		return new Error(`Vimeo API error: ${error.message}`);
	}

	return new Error('Vimeo API error: Unknown error');
}

export function extractVideoIdFromUri(uri: string): string {
	const segments = uri.split('/').filter((segment) => segment.length > 0);
	return segments[segments.length - 1] ?? uri;
}

export function normalizeVideoId({ input }: { input: string }): string {
	const trimmed = input.trim();
	const fromUrl = trimmed.match(/(?:vimeo\.com\/|videos\/)(\d+)/);
	if (fromUrl?.[1]) {
		return fromUrl[1];
	}
	const digitsOnly = trimmed.replace(/\D/g, '');
	if (digitsOnly.length === 0) {
		throw new Error(
			'Invalid Vimeo video ID. Enter the numeric ID from the video URL (e.g. 123456789).',
		);
	}
	return digitsOnly;
}

export const videoIdNumber = Property.ShortText({
	displayName: 'Video ID',
	description:
		'Numeric Vimeo video ID from the URL (e.g. vimeo.com/123456789 → 123456789).',
	required: true,
});

export const paginationProps = {
	page: Property.Number({
		displayName: 'Page',
		description: 'Page number of results (default 1).',
		required: false,
		defaultValue: 1,
	}),
	perPage: Property.Number({
		displayName: 'Per Page',
		description: 'Items per page, up to 100 (default 25).',
		required: false,
		defaultValue: 25,
	}),
};

export function buildPaginationQuery({
	page,
	perPage,
}: {
	page?: number | null;
	perPage?: number | null;
}): Record<string, string> {
	const query: Record<string, string> = {};
	if (page !== undefined && page !== null) {
		query['page'] = String(page);
	}
	if (perPage !== undefined && perPage !== null) {
		query['per_page'] = String(Math.min(perPage, 100));
	}
	return query;
}

export const userShowcaseDropdown = Property.Dropdown({
	auth: vimeoAuth,
	displayName: 'Showcase ID',
	description: 'ID of the showcase (album) to use',
	required: true,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Connect your Vimeo account first',
			};
		}

		const response = await apiRequest({
			auth,
			path: '/me/albums',
			method: HttpMethod.GET,
			queryParams: {
				per_page: '100',
			},
		});

		const body = response.body as VimeoListResponse;
		const showcases = (body.data ?? []).map((showcase) => ({
			value: extractVideoIdFromUri(showcase.uri),
			label: showcase.name,
		}));

		return { options: showcases };
	},
});

export const textTrackDropdown = Property.Dropdown({
	auth: vimeoAuth,
	displayName: 'Text Track ID',
	description: 'Select a text track on the video',
	required: true,
	refreshers: ['videoId'],
	options: async ({ auth, videoId }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Connect your Vimeo account first',
			};
		}

		if (!videoId) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Enter a video ID first',
			};
		}

		const normalizedId = normalizeVideoId({ input: String(videoId) });
		const response = await apiRequest({
			auth,
			path: `/videos/${normalizedId}/texttracks`,
			method: HttpMethod.GET,
			queryParams: {
				per_page: '100',
			},
		});

		const body = response.body as VimeoListResponse;
		const tracks = (body.data ?? []).map((track) => ({
			value: extractVideoIdFromUri(track.uri),
			label: track.name,
		}));

		return { options: tracks };
	},
});

export const userFolderDropdown = Property.Dropdown({
	auth: vimeoAuth,
	displayName: 'Folder ID',
	description: 'ID of the folder to add the video to',
	required: false,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Connect your Vimeo account first',
			};
		}

		const response = await apiRequest({
			auth,
			path: '/me/projects',
			method: HttpMethod.GET,
			queryParams: {
				per_page: '100',
			},
		});

		const body = response.body as VimeoListResponse;
		const folders = (body.data ?? []).map((folder) => ({
			value: extractVideoIdFromUri(folder.uri),
			label: folder.name,
		}));

		return { options: folders };
	},
});

export const userVideoDropdown = Property.Dropdown({
	auth: vimeoAuth,
	displayName: 'Video',
	description: 'Select one of your Vimeo videos',
	required: true,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Connect your Vimeo account first',
			};
		}

		const response = await apiRequest({
			auth,
			path: '/me/videos',
			method: HttpMethod.GET,
			queryParams: {
				per_page: '100',
				sort: 'date',
				direction: 'desc',
			},
		});

		const body = response.body as VimeoListResponse;
		const videos = (body.data ?? []).map((video) => ({
			value: extractVideoIdFromUri(video.uri),
			label: video.name,
		}));

		return { options: videos };
	},
});

