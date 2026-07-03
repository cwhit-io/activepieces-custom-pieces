import {
	createCustomApiCallAction,
	HttpError,
	HttpMethod,
	QueryParams,
} from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from './client';
import { planningCenterCommon } from './props';

function resolveRequestUrl({
	urlInput,
	baseUrl,
}: {
	urlInput: string;
	baseUrl: string;
}): string {
	if (urlInput.startsWith('http://') || urlInput.startsWith('https://')) {
		return urlInput;
	}
	const normalizedBase = baseUrl.endsWith('/')
		? baseUrl.slice(0, -1)
		: baseUrl;
	const relativePath = urlInput.startsWith('/')
		? urlInput
		: `/${urlInput}`;
	return `${normalizedBase}${relativePath}`;
}

function parsePlanningCenterGetRequest({
	urlValue,
	queryParams,
}: {
	urlValue: string;
	queryParams?: QueryParams;
}): { path: string; queryParams: Record<string, string> } | null {
	const fullUrl = resolveRequestUrl({
		urlInput: urlValue,
		baseUrl: planningCenterClient.BASE_URL,
	});

	let parsed: URL;
	try {
		parsed = new URL(fullUrl);
	} catch {
		return null;
	}

	const baseOrigin = new URL(planningCenterClient.BASE_URL).origin;
	if (parsed.origin !== baseOrigin) {
		return null;
	}

	const mergedQuery: Record<string, string> = {};
	for (const [key, value] of parsed.searchParams.entries()) {
		mergedQuery[key] = value;
	}
	if (queryParams) {
		for (const [key, value] of Object.entries(queryParams)) {
			if (value !== undefined && value !== null) {
				mergedQuery[key] = String(value);
			}
		}
	}
	delete mergedQuery['offset'];

	return { path: parsed.pathname, queryParams: mergedQuery };
}

export function createPlanningCenterCustomApiCallAction({
	userAgent,
}: {
	userAgent: string;
}) {
	const baseAction = createCustomApiCallAction({
		auth: planningCenterAuth,
		baseUrl: () => planningCenterClient.BASE_URL,
		authMapping: async (auth) => {
			const credentials = planningCenterClient.credentialsFromAuthProps(
				auth.props,
			);
			const encoded = Buffer.from(
				`${credentials.applicationId}:${credentials.secret}`,
			).toString('base64');

			return {
				Authorization: `Basic ${encoded}`,
				'User-Agent': userAgent,
			};
		},
		extraProps: {
			fetch_all_pages: planningCenterCommon.fetchAllPages,
			max_results: planningCenterCommon.maxResults,
		},
	});

	return createAction({
		name: baseAction.name,
		displayName: baseAction.displayName,
		description: baseAction.description,
		auth: planningCenterAuth,
		requireAuth: baseAction.requireAuth,
		audience: baseAction.audience,
		props: {
			...baseAction.props,
			fetch_all_pages: planningCenterCommon.fetchAllPages,
			max_results: planningCenterCommon.maxResults,
		},
		run: async (context) => {
			const {
				method,
				url,
				queryParams,
				fetch_all_pages: fetchAllPages,
				max_results: maxResultsInput,
				response_is_binary,
				failsafe,
			} = context.propsValue;

			const shouldPaginate =
				(fetchAllPages ?? true) &&
				method === HttpMethod.GET &&
				!response_is_binary;

			if (!shouldPaginate) {
				return baseAction.run(context);
			}

			const urlValue = url?.['url'];
			if (typeof urlValue !== 'string' || urlValue.length === 0) {
				return baseAction.run(context);
			}

			const parsed = parsePlanningCenterGetRequest({
				urlValue,
				queryParams: (queryParams as QueryParams) ?? {},
			});
			if (!parsed) {
				return baseAction.run(context);
			}

			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(
					context.auth.props,
				);
				const maxResults =
					maxResultsInput !== undefined && maxResultsInput !== null
						? Number(maxResultsInput)
						: undefined;

				const body = await planningCenterClient.paginatedJsonApiListResponse({
					credentials,
					path: parsed.path,
					queryParams: parsed.queryParams,
					maxResults,
				});

				return {
					status: 200,
					headers: {},
					body,
				};
			} catch (error) {
				if (failsafe) {
					return (error as HttpError).errorMessage();
				}
				throw error;
			}
		},
	});
}