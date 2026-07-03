import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const removePlanTeamMemberAction = createAction({
	auth: planningCenterAuth,
	name: 'remove_plan_team_member',
	displayName: 'Remove Plan Team Member',
	description: 'Removes a person from a plan (unschedules them).',
	audience: 'both',
	aiMetadata: {
		description:
			'Delete a plan team member assignment via DELETE. Use to unschedule someone from a service. Destructive and not idempotent.',
		idempotent: false,
	},
	props: {
		service_type: planningCenterCommon.serviceTypeDropdown,
		plan: planningCenterCommon.planDropdown,
		team_member: planningCenterCommon.planTeamMemberDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			service_type: serviceType,
			plan,
			team_member: teamMember,
		} = context.propsValue;

		await planningCenterClient.apiCall({
			credentials,
			method: HttpMethod.DELETE,
			path: `/services/v2/service_types/${serviceType}/plans/${plan}/team_members/${teamMember}`,
		});

		return {
			deleted: true,
			team_member_id: teamMember,
			plan_id: plan,
			service_type_id: serviceType,
		};
	},
});