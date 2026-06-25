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
			'List team members scheduled on a plan. Use to see current assignments and confirm who is serving on a date. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		service_type: planningCenterCommon.serviceTypeDropdown,
		plan: planningCenterCommon.planDropdown,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { service_type, plan, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		return await planningCenterClient.listResources({
			credentials,
			path: `/services/v2/service_types/${service_type}/plans/${plan}/team_members`,
			fetchAll,
		});
	},
});