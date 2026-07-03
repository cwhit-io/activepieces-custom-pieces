import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listNeededPositionsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_needed_positions',
	displayName: 'List Needed Positions',
	description: 'Lists open volunteer slots on a plan.',
	audience: 'both',
	aiMetadata: {
		description:
			'List needed positions (open volunteer slots) on a plan. Use optional Team Filter to scope to one team — the API has no native team query param, so filtering uses team relationships and position names. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		service_type: planningCenterCommon.serviceTypeDropdown,
		plan: planningCenterCommon.planDropdown,
		team: planningCenterCommon.teamDropdownOptional,
		page_size: planningCenterCommon.pageSize,
		max_results: planningCenterCommon.maxResults,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			service_type: serviceType,
			plan,
			team,
			page_size: pageSize,
			max_results: maxResultsProp,
			fetch_all_pages: fetchAllPages,
		} = context.propsValue;
		const fetchAll = fetchAllPages ?? true;

		const queryParams: Record<string, string> = {};
		if (pageSize) {
			queryParams['per_page'] = String(pageSize);
		}
		const maxResults = maxResultsProp ? Number(maxResultsProp) : undefined;

		return await planningCenterClient.listResources({
			credentials,
			path: `/services/v2/service_types/${serviceType}/plans/${plan}/needed_positions`,
			queryParams,
			fetchAll,
			maxResults,
			teamId: team ?? undefined,
		});
	},
});