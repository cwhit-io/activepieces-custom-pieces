import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const getPlanTeamSchedulingAction = createAction({
	auth: planningCenterAuth,
	name: 'get_plan_team_scheduling',
	displayName: 'Get Plan Team Scheduling',
	description:
		'Fetches needed positions and scheduled people for a plan in one call, with optional team filter.',
	audience: 'both',
	aiMetadata: {
		description:
			'Returns needed_positions and plan_people (team_members) for a plan in a single response. Set Team Filter to scope both lists to one team — ideal before AI scheduling steps so you fetch once instead of two list actions plus manual filtering. Read-only and safe to retry.',
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
		const teamId = team ?? undefined;
		const planBase = `/services/v2/service_types/${serviceType}/plans/${plan}`;

		const listOptions = {
			credentials,
			queryParams,
			fetchAll,
			maxResults,
			teamId,
		};

		const [neededPositions, planPeople] = await Promise.all([
			planningCenterClient.listResources({
				...listOptions,
				path: `${planBase}/needed_positions`,
			}),
			planningCenterClient.listResources({
				...listOptions,
				path: `${planBase}/team_members`,
			}),
		]);

		return {
			service_type_id: serviceType,
			plan_id: plan,
			team_id: teamId ?? null,
			filtered_by_team: Boolean(teamId),
			needed_positions: neededPositions,
			plan_people: planPeople,
			needed_positions_count: neededPositions.length,
			plan_people_count: planPeople.length,
		};
	},
});