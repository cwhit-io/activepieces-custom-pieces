import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const acceptScheduleAction = createAction({
	auth: planningCenterAuth,
	name: 'accept_schedule',
	displayName: 'Accept Schedule',
	description:
		'Accepts a scheduling request for a person (confirms volunteer assignment).',
	audience: 'both',
	aiMetadata: {
		description:
			'Accept a pending schedule for a person via POST. Use after List Scheduling Requests to auto-confirm volunteers from email or Slack flows. Not idempotent: repeating may error if already accepted.',
		idempotent: false,
	},
	props: {
		person_search: planningCenterCommon.personSearch,
		person: planningCenterCommon.personDropdown,
		schedule: planningCenterCommon.scheduleDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { person, schedule } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.POST,
			path: `/services/v2/people/${person}/schedules/${schedule}/accept`,
		});

		if (response.body.data) {
			return planningCenterClient.flattenJsonApiResource(response.body.data);
		}

		return {
			accepted: true,
			person_id: person,
			schedule_id: schedule,
		};
	},
});

type JsonApiSingleResponse = {
	data?: {
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	};
};