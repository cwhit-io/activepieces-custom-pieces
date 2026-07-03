import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const getChannelAction = createAction({
	auth: planningCenterAuth,
	name: 'get_channel',
	displayName: 'Get Channel',
	description: 'Gets a single channel.',
	audience: 'both',
	aiMetadata: {
		description: 'Get one Publishing channel metadata. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		channel: planningCenterCommon.channelDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { channel } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/publishing/v2/channels/${context.propsValue.channel}`,
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
