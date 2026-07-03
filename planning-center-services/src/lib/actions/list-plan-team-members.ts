import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listPlanTeamMembersAction = createAction({
	auth: planningCenterAuth,
	name: 'list_plan_team_members',
	displayName: 'List Plan Team Members',
	description: 'Lists who is scheduled on a specific plan.',
	audience: 'both',
	aiMetadata: {
		description:
			'List team members scheduled on a plan. Use optional Team Filter to limit to one team. Read-only and safe to retry.',
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
			path: `/services/v2/service_types/${serviceType}/plans/${plan}/team_members`,
			queryParams,
			fetchAll,
			maxResults,
			teamId: team ?? undefined,
		});
	},
});