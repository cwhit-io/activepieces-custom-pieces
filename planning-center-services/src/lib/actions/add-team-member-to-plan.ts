import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const addTeamMemberToPlanAction = createAction({
	auth: planningCenterAuth,
	name: 'add_team_member_to_plan',
	displayName: 'Add Team Member to Plan',
	description: 'Schedules a person onto a plan for a specific team.',
	audience: 'both',
	aiMetadata: {
		description:
			'Add a person to a plan team via POST team_members. Requires service type, plan, person, and team. Each call creates a new assignment; retries may duplicate.',
		idempotent: false,
	},
	props: {
		service_type: planningCenterCommon.serviceTypeDropdown,
		plan: planningCenterCommon.planDropdown,
		person_search: planningCenterCommon.personSearch,
		person: planningCenterCommon.personDropdown,
		team: planningCenterCommon.teamDropdown,
		team_position_name: Property.ShortText({
			displayName: 'Team Position Name',
			description:
				'Optional. Position name for this assignment (e.g. Lead Vocals).',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description:
				'Optional. Initial assignment status. Defaults to Unconfirmed if not set.',
			required: false,
			options: {
				options: [
					{ label: 'Confirmed', value: 'Confirmed' },
					{ label: 'Unconfirmed', value: 'Unconfirmed' },
					{ label: 'Declined', value: 'Declined' },
				],
			},
		}),
		notes: Property.LongText({
			displayName: 'Notes',
			description: 'Optional notes on the assignment.',
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
			person,
			team,
			team_position_name: teamPositionName,
			status,
			notes,
			prepare_notification: prepareNotification,
		} = context.propsValue;

		const attributes: Record<string, unknown> = {};
		if (typeof teamPositionName === 'string' && teamPositionName.trim().length > 0) {
			attributes['team_position_name'] = teamPositionName.trim();
		}
		if (typeof status === 'string' && status.length > 0) {
			attributes['status'] = status;
		}
		if (typeof notes === 'string' && notes.length > 0) {
			attributes['notes'] = notes;
		}
		if (typeof prepareNotification === 'boolean') {
			attributes['prepare_notification'] = prepareNotification;
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.POST,
			path: `/services/v2/service_types/${serviceType}/plans/${plan}/team_members`,
			body: {
				data: {
					type: 'PlanPerson',
					attributes,
					relationships: {
						person: {
							data: {
								type: 'Person',
								id: person,
							},
						},
						team: {
							data: {
								type: 'Team',
								id: team,
							},
						},
					},
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Failed to add team member to plan.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});

type JsonApiSingleResponse = {
	data?: {
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	};
};