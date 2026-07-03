import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const getNextSignupTimeAction = createAction({
	auth: planningCenterAuth,
	name: 'get_next_signup_time',
	displayName: 'Get Next Signup Time',
	description: 'Gets the next upcoming signup time for a signup.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get the next upcoming time slot for a signup event. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		registration_event: planningCenterCommon.registrationEventDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { registration_event } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiListResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/registrations/v2/signups/${registration_event}/next_signup_time`,
		});

		const resources = response.body.data ?? [];
		if (!resources.length) {
			throw new Error('Next signup time not found.');
		}

		return planningCenterClient.flattenJsonApiResource(resources[0]);
	},
});

type JsonApiListResponse = {
	data?: Array<{
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	}>;
};