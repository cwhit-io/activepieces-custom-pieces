import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listItemAssignmentsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_item_assignments',
	displayName: 'List Item Assignments',
	description:
		'Lists person or position assignments for a plan item.',
	audience: 'both',
	aiMetadata: {
		description:
			'List item assignments for a plan item. Use to see who is assigned to songs or setlist items. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		service_type: planningCenterCommon.serviceTypeDropdown,
		plan: planningCenterCommon.planDropdown,
		plan_item: planningCenterCommon.planItemDropdown,
		page_size: planningCenterCommon.pageSize,
		max_results: planningCenterCommon.maxResults,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			service_type,
			plan,
			plan_item: planItem,
			page_size,
			max_results,
			fetch_all_pages,
		} = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		const queryParams: Record<string, string> = {};
		if (page_size) {
			queryParams['per_page'] = String(page_size);
		}
		const maxResults = max_results ? Number(max_results) : undefined;

		return await planningCenterClient.listResources({
			credentials,
			path: `/services/v2/service_types/${service_type}/plans/${plan}/items/${planItem}/item_assignments`,
			queryParams,
			fetchAll,
			maxResults,
		});
	},
});