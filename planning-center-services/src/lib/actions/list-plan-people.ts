import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listPlanPeopleAction = createAction({
	auth: planningCenterAuth,
	name: 'list_plan_people',
	displayName: 'List Plan People',
	description:
		'Lists scheduled team members on a plan (Services API team_members).',
	audience: 'both',
	aiMetadata: {
		description:
			'List scheduled people on a plan (team_members). Use optional Team Filter to scope to one team before AI or autoschedule steps. Read-only and safe to retry.',
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