import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const declineScheduleAction = createAction({
	auth: planningCenterAuth,
	name: 'decline_schedule',
	displayName: 'Decline Schedule',
	description:
		'Declines a scheduling request for a person.',
	audience: 'both',
	aiMetadata: {
		description:
			'Decline a pending schedule for a person via POST. Use after List Scheduling Requests to process volunteer declines from automated flows. Not idempotent: repeating may error if already declined.',
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
			path: `/services/v2/people/${person}/schedules/${schedule}/decline`,
		});

		if (response.body.data) {
			return planningCenterClient.flattenJsonApiResource(response.body.data);
		}

		return {
			declined: true,
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