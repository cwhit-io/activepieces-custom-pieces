import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const getSpeakerAction = createAction({
	auth: planningCenterAuth,
	name: 'get_speaker',
	displayName: 'Get Speaker',
	description: 'Gets a single speaker.',
	audience: 'both',
	aiMetadata: {
		description: 'Get speaker bio and image by id. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		speaker: planningCenterCommon.speakerDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { speaker } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/publishing/v2/speakers/${speaker}`,
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
