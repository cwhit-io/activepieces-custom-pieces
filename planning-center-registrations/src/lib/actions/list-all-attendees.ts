import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import {
	buildIncludeQueryParam,
	planningCenterCommon,
} from '../common/props';

export const listAllAttendeesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_all_attendees',
	displayName: 'List All Attendees',
	description:
		'Lists attendees organization-wide, optionally filtered by registration.',
	audience: 'both',
	aiMetadata: {
		description:
			'List all attendees across signups with optional registration filter and related includes. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		registration: planningCenterCommon.optionalRegistrationDropdown,
		include: planningCenterCommon.attendeeInclude,
		sort_direction: planningCenterCommon.sortDirection,
		page_size: planningCenterCommon.pageSize,
		max_results: planningCenterCommon.maxResults,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			registration,
			include,
			sort_direction,
			page_size,
			max_results,
			fetch_all_pages,
		} = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		const queryParams: Record<string, string> = {
			...buildIncludeQueryParam(include),
		};

		if (registration) {
			queryParams['where[registration_id]'] = registration;
		}

		if (sort_direction === 'desc') {
			queryParams['order'] = '-created_at';
		} else if (sort_direction === 'asc') {
			queryParams['order'] = 'created_at';
		}

		if (page_size) {
			queryParams['per_page'] = String(page_size);
		}

		const maxResults = max_results ? Number(max_results) : undefined;

		if (fetchAll) {
			const response =
				await planningCenterClient.paginatedJsonApiListResponse({
					credentials,
					path: '/registrations/v2/attendees',
					queryParams,
					maxResults,
				});

			const result = planningCenterClient.flattenJsonApiCollection(
				response.data ?? [],
			);

			if (response.included?.length) {
				return {
					attendees: result,
					included: planningCenterClient.flattenJsonApiCollection(
						response.included,
					),
				};
			}

			return result;
		}

		const response = await planningCenterClient.apiCall<JsonApiListResponse>({
			credentials,
			method: HttpMethod.GET,
			path: '/registrations/v2/attendees',
			queryParams,
		});

		const result = planningCenterClient.flattenJsonApiCollection(
			response.body.data ?? [],
		);

		if (response.body.included?.length) {
			return {
				attendees: result,
				included: planningCenterClient.flattenJsonApiCollection(
					response.body.included,
				),
			};
		}

		return maxResults ? result.slice(0, maxResults) : result;
	},
});

type JsonApiListResponse = {
	data?: Array<{
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	}>;
	included?: Array<{
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	}>;
};