import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

type JsonApiSingleResponse = {
	data?: {
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	};
};

export const createEpisodeTimeAction = createAction({
	auth: planningCenterAuth,
	name: 'create_episode_time',
	displayName: 'Create Episode Time',
	description: 'Adds a scheduled publish/service time to an episode.',
	audience: 'both',
	aiMetadata: {
		description:
			'Create an episode time (service/publish slot) on a Publishing episode. Each call creates a new time.',
		idempotent: false,
	},
	props: {
		episode: planningCenterCommon.episodeDropdown,
		starts_at: Property.DateTime({
			displayName: 'Starts At',
			description:
				'When this episode time starts, in ISO 8601 format (e.g. 2026-06-25T09:00:00Z).',
			required: true,
		}),
		video_url: Property.ShortText({
			displayName: 'Video URL',
			description: 'Video URL for this specific service time.',
			required: false,
		}),
		video_embed_code: Property.LongText({
			displayName: 'Video Embed Code',
			description: 'Embed code for this specific service time.',
			required: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			episode,
			starts_at: startsAt,
			video_url: videoUrl,
			video_embed_code: videoEmbedCode,
		} = context.propsValue;

		const attributes: Record<string, unknown> = {
			starts_at: startsAt,
		};

		if (typeof videoUrl === 'string' && videoUrl.trim().length > 0) {
			attributes['video_url'] = videoUrl.trim();
		}
		if (typeof videoEmbedCode === 'string' && videoEmbedCode.length > 0) {
			attributes['video_embed_code'] = videoEmbedCode;
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.POST,
			path: `/publishing/v2/episodes/${episode}/episode_times`,
			body: {
				data: {
					type: 'EpisodeTime',
					attributes,
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Episode time creation succeeded but no data was returned.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});