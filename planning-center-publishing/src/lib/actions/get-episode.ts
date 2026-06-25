import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const getEpisodeAction = createAction({
	auth: planningCenterAuth,
	name: 'get_episode',
	displayName: 'Get Episode',
	description: 'Gets a single episode.',
	audience: 'both',
	aiMetadata: {
		description: 'Get one episode including scripture, speaker, and publish status. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		episode: planningCenterCommon.episodeDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { episode } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/publishing/v2/episodes/${episode}`,
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
