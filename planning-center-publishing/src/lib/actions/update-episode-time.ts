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

export const updateEpisodeTimeAction = createAction({
	auth: planningCenterAuth,
	name: 'update_episode_time',
	displayName: 'Update Episode Time',
	description: 'Updates a scheduled publish/service time on an episode.',
	audience: 'both',
	aiMetadata: {
		description:
			'Patch an episode time starts_at, video URL, or embed code. Provide at least one field to change.',
		idempotent: true,
	},
	props: {
		episode: planningCenterCommon.episodeDropdown,
		episode_time_id: Property.ShortText({
			displayName: 'Episode Time ID',
			description: 'Episode time ID (from List Episode Times).',
			required: true,
		}),
		starts_at: Property.DateTime({
			displayName: 'Starts At',
			description: 'New start time. Leave empty to keep unchanged.',
			required: false,
		}),
		video_url: Property.ShortText({
			displayName: 'Video URL',
			description: 'New video URL. Leave empty to keep unchanged.',
			required: false,
		}),
		video_embed_code: Property.LongText({
			displayName: 'Video Embed Code',
			description: 'New embed code. Leave empty to keep unchanged.',
			required: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			episode,
			episode_time_id: episodeTimeId,
			starts_at: startsAt,
			video_url: videoUrl,
			video_embed_code: videoEmbedCode,
		} = context.propsValue;

		const attributes: Record<string, unknown> = {};

		if (typeof startsAt === 'string' && startsAt.length > 0) {
			attributes['starts_at'] = startsAt;
		}
		if (typeof videoUrl === 'string' && videoUrl.trim().length > 0) {
			attributes['video_url'] = videoUrl.trim();
		}
		if (typeof videoEmbedCode === 'string' && videoEmbedCode.length > 0) {
			attributes['video_embed_code'] = videoEmbedCode;
		}

		if (Object.keys(attributes).length === 0) {
			throw new Error(
				'Provide at least one field to update (starts_at, video URL, or embed code).',
			);
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.PATCH,
			path: `/publishing/v2/episodes/${episode}/episode_times/${episodeTimeId.trim()}`,
			body: {
				data: {
					type: 'EpisodeTime',
					attributes,
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Episode time update succeeded but no data was returned.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});