import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listTeamPositionsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_team_positions',
	displayName: 'List Team Positions',
	description: 'Lists roles/positions within a team.',
	audience: 'both',
	aiMetadata: {
		description:
			'List positions for a team. Use to map needed positions to team roles when building scheduling automations. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		service_type: planningCenterCommon.serviceTypeDropdown,
		team: planningCenterCommon.teamDropdown,
		page_size: planningCenterCommon.pageSize,
		max_results: planningCenterCommon.maxResults,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { team, page_size, max_results, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		const queryParams: Record<string, string> = {};
		if (page_size) {
			queryParams['per_page'] = String(page_size);
		}
		const maxResults = max_results ? Number(max_results) : undefined;

		return await planningCenterClient.listResources({
			credentials,
			path: `/services/v2/teams/${context.propsValue.team}/team_positions`,
			queryParams,
			fetchAll,
			maxResults,
		});
	},
});