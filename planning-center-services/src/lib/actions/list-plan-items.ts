import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listPlanItemsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_plan_items',
	displayName: 'List Plan Items',
	description: 'Lists songs and setlist items on a plan.',
	audience: 'both',
	aiMetadata: {
		description:
			'List plan items (songs, headers, media) on a plan. Use for setlist and worship planning automations. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		service_type: planningCenterCommon.serviceTypeDropdown,
		plan: planningCenterCommon.planDropdown,
		page_size: planningCenterCommon.pageSize,
		max_results: planningCenterCommon.maxResults,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { service_type, plan, page_size, max_results, fetch_all_pages } =
			context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		const queryParams: Record<string, string> = {};
		if (page_size) {
			queryParams['per_page'] = String(page_size);
		}
		const maxResults = max_results ? Number(max_results) : undefined;

		return await planningCenterClient.listResources({
			credentials,
			path: `/services/v2/service_types/${service_type}/plans/${plan}/items`,
			queryParams,
			fetchAll,
			maxResults,
		});
	},
});