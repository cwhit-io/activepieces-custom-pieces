import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const getEpisodeAction = createAction({
	auth: planningCenterAuth,
	name: 'get_episode',
	displayName: 'Get Episode',
	description: 'Gets a single episode with optional related resources.',
	audience: 'both',
	aiMetadata: {
		description: 'Get one episode including scripture, speaker, and publish status. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		episode: planningCenterCommon.episodeDropdown,
		include: planningCenterCommon.episodeInclude,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { episode, include } = context.propsValue;

		const queryParams: Record<string, string> = {};
		if (Array.isArray(include) && include.length > 0) {
			queryParams['include'] = include.join(',');
		}

		const response = await planningCenterClient.apiCall<JsonApiEpisodeResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/publishing/v2/episodes/${episode}`,
			queryParams,
		});

		if (!response.body.data) {
			throw new Error('Resource not found.');
		}

		const included = response.body.included ?? [];
		const result: Record<string, unknown> = {
			...planningCenterClient.flattenJsonApiResource(response.body.data),
			included,
		};

		if (Array.isArray(include) && include.length > 0) {
			for (const includeKey of include) {
				const typeMap: Record<string, string> = {
					episode_resources: 'EpisodeResource',
					speakerships: 'Speakership',
					series: 'Series',
				};
				const resourceType = typeMap[includeKey];
				if (resourceType) {
					result[includeKey] = planningCenterClient.flattenJsonApiCollection(
						included.filter((resource) => resource.type === resourceType),
					);
				}
			}
		}

		return result;
	},
});

type JsonApiResource = {
	type: string;
	id: string;
	attributes?: Record<string, unknown>;
};

type JsonApiEpisodeResponse = {
	data?: JsonApiResource;
	included?: JsonApiResource[];
};
