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
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { team, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		return await planningCenterClient.listResources({
			credentials,
			path: `/services/v2/teams/${team}/positions`,
			fetchAll,
		});
	},
});