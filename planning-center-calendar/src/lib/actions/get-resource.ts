import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const getResourceAction = createAction({
	auth: planningCenterAuth,
	name: 'get_resource',
	displayName: 'Get Resource',
	description: 'Gets a single room or equipment resource by ID.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get one calendar resource (room or equipment) including location and quantity. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		resource: planningCenterCommon.calendarResourceDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/calendar/v2/resources/${context.propsValue.resource}`,
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