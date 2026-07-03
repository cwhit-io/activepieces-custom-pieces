import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const getSignupLocationAction = createAction({
	auth: planningCenterAuth,
	name: 'get_signup_location',
	displayName: 'Get Signup Location',
	description: 'Gets the venue/location for a signup.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get the location details for a registration signup. Read-only and safe to retry.',
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
			path: `/registrations/v2/signups/${registration_event}/signup_location`,
		});

		const resources = response.body.data ?? [];
		if (!resources.length) {
			throw new Error('Signup location not found.');
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