import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

type JsonApiResource = {
	type: string;
	id: string;
	attributes?: Record<string, unknown>;
};

type JsonApiListResponse = {
	data?: JsonApiResource[];
	included?: JsonApiResource[];
};

export const getCurrentEpisodeAction = createAction({
	auth: planningCenterAuth,
	name: 'get_current_episode',
	displayName: 'Get Current Episode',
	description:
		'Gets the live/current episode for a channel without date math.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get the current (live) episode for a Publishing channel. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		channel: planningCenterCommon.channelDropdown,
		include: planningCenterCommon.episodeInclude,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { channel, include } = context.propsValue;

		const queryParams: Record<string, string> = {};
		if (Array.isArray(include) && include.length > 0) {
			queryParams['include'] = include.join(',');
		}

		const response = await planningCenterClient.apiCall<JsonApiListResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/publishing/v2/channels/${channel}/current_episode`,
			queryParams,
		});

		const episodes = response.body.data ?? [];
		const included = response.body.included ?? [];

		if (episodes.length === 0) {
			throw new Error(`No current episode found for channel ${channel}.`);
		}

		const currentEpisode = episodes[0];
		const result: Record<string, unknown> = {
			...planningCenterClient.flattenJsonApiResource(currentEpisode),
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