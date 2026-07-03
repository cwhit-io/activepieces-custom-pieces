import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const getResourceRequestAnswersAction = createAction({
	auth: planningCenterAuth,
	name: 'get_resource_request_answers',
	displayName: 'Get Resource Request Answers',
	description: 'Lists form answers on an event resource request.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get answers submitted on an event resource request form. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		event_resource_request: planningCenterCommon.eventResourceRequestDropdown,
		page_size: planningCenterCommon.pageSize,
		max_results: planningCenterCommon.maxResults,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { page_size, max_results, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		const queryParams: Record<string, string> = {};
		if (page_size) {
			queryParams['per_page'] = String(page_size);
		}
		const maxResults = max_results ? Number(max_results) : undefined;

		return await planningCenterClient.listResources({
			credentials,
			path: `/calendar/v2/event_resource_requests/${context.propsValue.event_resource_request}/answers`,
			queryParams,
			fetchAll,
			maxResults,
		});
	},
});