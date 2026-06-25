import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listTeamMembersAction = createAction({
	auth: planningCenterAuth,
	name: 'list_team_members',
	displayName: 'List Team Members',
	description:
		'Lists people on a team roster and the positions they can fill.',
	audience: 'both',
	aiMetadata: {
		description:
			'List team members for a team. Use to find volunteers eligible for scheduling and their position assignments. Read-only and safe to retry.',
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
			path: `/services/v2/teams/${team}/team_members`,
			fetchAll,
		});
	},
});