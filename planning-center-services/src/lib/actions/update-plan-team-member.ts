import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const updatePlanTeamMemberAction = createAction({
	auth: planningCenterAuth,
	name: 'update_plan_team_member',
	displayName: 'Update Plan Team Member',
	description:
		'Updates a team member assignment on a plan (position, time, status).',
	audience: 'both',
	aiMetadata: {
		description:
			'Patch a plan team member assignment. Change status, team position, notes, or notification settings on an existing plan schedule. Provide at least one field to update.',
		idempotent: true,
	},
	props: {
		service_type: planningCenterCommon.serviceTypeDropdown,
		plan: planningCenterCommon.planDropdown,
		team_member: planningCenterCommon.planTeamMemberDropdown,
		status: Property.StaticDropdown({
			displayName: 'Status',
			description:
				'Assignment status. Leave empty to keep unchanged.',
			required: false,
			options: {
				options: [
					{ label: 'Confirmed', value: 'Confirmed' },
					{ label: 'Unconfirmed', value: 'Unconfirmed' },
					{ label: 'Declined', value: 'Declined' },
				],
			},
		}),
		team_position_name: Property.ShortText({
			displayName: 'Team Position Name',
			description: 'Position name on the plan. Leave empty to keep unchanged.',
			required: false,
		}),
		notes: Property.LongText({
			displayName: 'Notes',
			description: 'Notes on the assignment. Leave empty to keep unchanged.',
			required: false,
		}),
		decline_reason: Property.ShortText({
			displayName: 'Decline Reason',
			description: 'Reason for declining. Leave empty to keep unchanged.',
			required: false,
		}),
		prepare_notification: Property.Checkbox({
			displayName: 'Prepare Notification',
			description:
				'When enabled, prepares a scheduling notification for this assignment.',
			required: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			service_type: serviceType,
			plan,
			team_member: teamMember,
			status,
			team_position_name: teamPositionName,
			notes,
			decline_reason: declineReason,
			prepare_notification: prepareNotification,
		} = context.propsValue;

		const attributes = buildPlanPersonAttributes({
			status,
			teamPositionName,
			notes,
			declineReason,
			prepareNotification,
		});

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.PATCH,
			path: `/services/v2/service_types/${serviceType}/plans/${plan}/team_members/${teamMember}`,
			body: {
				data: {
					type: 'PlanPerson',
					attributes,
				},
			},
		});

		if (!response.body.data) {
			throw new Error(
				'Plan team member update succeeded but no data was returned.',
			);
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});

function buildPlanPersonAttributes({
	status,
	teamPositionName,
	notes,
	declineReason,
	prepareNotification,
}: {
	status?: string;
	teamPositionName?: string;
	notes?: string;
	declineReason?: string;
	prepareNotification?: boolean;
}): Record<string, unknown> {
	const attributes: Record<string, unknown> = {};

	if (typeof status === 'string' && status.length > 0) {
		attributes['status'] = status;
	}
	if (typeof teamPositionName === 'string' && teamPositionName.trim().length > 0) {
		attributes['team_position_name'] = teamPositionName.trim();
	}
	if (typeof notes === 'string' && notes.length > 0) {
		attributes['notes'] = notes;
	}
	if (typeof declineReason === 'string' && declineReason.trim().length > 0) {
		attributes['decline_reason'] = declineReason.trim();
	}
	if (typeof prepareNotification === 'boolean') {
		attributes['prepare_notification'] = prepareNotification;
	}

	if (Object.keys(attributes).length === 0) {
		throw new Error(
			'Provide at least one field to update (status, team position name, notes, etc.).',
		);
	}

	return attributes;
}

type JsonApiSingleResponse = {
	data?: {
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	};
};