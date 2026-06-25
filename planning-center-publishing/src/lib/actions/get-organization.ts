import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';

export const getOrganizationAction = createAction({
	auth: planningCenterAuth,
	name: 'get_organization',
	displayName: 'Get Organization',
	description: 'Gets Publishing organization settings.',
	audience: 'both',
	aiMetadata: {
		description: 'Get global Publishing organization settings and branding defaults. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.GET,
			path: '/publishing/v2/organization',
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
