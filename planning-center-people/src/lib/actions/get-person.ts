import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const getPersonAction = createAction({
	auth: planningCenterAuth,
	name: 'get_person',
	displayName: 'Get Person',
	description: 'Gets a single person profile by ID.',
	audience: 'both',
	aiMetadata: {
		description: 'Get one person profile including household, campus, and status fields. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		person: planningCenterCommon.personDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { person } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/people/v2/people/${context.propsValue.person}`,
		});

		if (!response.body.data) {
			throw new Error('Resource not found.');
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
