import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const createPlanTimeAction = createAction({
	auth: planningCenterAuth,
	name: 'create_plan_time',
	displayName: 'Create Plan Time',
	description: 'Creates a new service time on a plan.',
	audience: 'both',
	aiMetadata: {
		description:
			'Create a plan time on a plan (e.g. add an 11:00 AM service). Each call creates a new time slot; retries may duplicate. Prefer List Plan Times first to avoid duplicates.',
		idempotent: false,
	},
	props: {
		service_type: planningCenterCommon.serviceTypeDropdown,
		plan: planningCenterCommon.planDropdown,
		name: Property.ShortText({
			displayName: 'Time Name',
			description:
				'Label for this service time as shown in Planning Center (e.g. 9:00 AM or Rehearsal).',
			required: true,
		}),
		time: Property.DateTime({
			displayName: 'Time',
			description:
				'The date and time for this plan time in ISO 8601 format (e.g. 2026-06-25T09:00:00Z).',
			required: true,
		}),
		team_remind: Property.Checkbox({
			displayName: 'Send Team Reminders',
			description: 'Whether to send scheduling reminders to team members.',
			required: false,
			defaultValue: true,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { service_type, plan, name, time, team_remind } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.POST,
			path: `/services/v2/service_types/${service_type}/plans/${plan}/plan_times`,
			body: {
				data: {
					type: 'PlanTime',
					attributes: {
						name,
						time,
						team_remind: team_remind ?? true,
					},
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Failed to create plan time.');
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