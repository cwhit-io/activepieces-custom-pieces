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

export const setCurrentEpisodeAction = createAction({
	auth: planningCenterAuth,
	name: 'set_current_episode',
	displayName: 'Set Current Episode',
	description:
		'Sets or updates the live/current episode on a channel (go-live).',
	audience: 'both',
	aiMetadata: {
		description:
			'Patch the current episode on a Publishing channel to go live. Optionally update title, video URL, or stream type at the same time.',
		idempotent: true,
	},
	props: {
		channel: planningCenterCommon.channelDropdown,
		episode: planningCenterCommon.episodeDropdown,
		title: Property.ShortText({
			displayName: 'Title',
			description: 'New episode title. Leave empty to keep unchanged.',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'New episode description. Leave empty to keep unchanged.',
			required: false,
		}),
		video_url: Property.ShortText({
			displayName: 'Video URL',
			description: 'Live/stream video URL. Leave empty to keep unchanged.',
			required: false,
		}),
		stream_type: planningCenterCommon.streamType,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			channel,
			episode,
			title,
			description,
			video_url: videoUrl,
			stream_type: streamType,
		} = context.propsValue;

		const attributes: Record<string, unknown> = {};

		if (typeof title === 'string' && title.trim().length > 0) {
			attributes['title'] = title.trim();
		}
		if (typeof description === 'string' && description.length > 0) {
			attributes['description'] = description;
		}
		if (typeof videoUrl === 'string' && videoUrl.trim().length > 0) {
			attributes['video_url'] = videoUrl.trim();
		}
		if (typeof streamType === 'string' && streamType.length > 0) {
			attributes['stream_type'] = streamType;
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.PATCH,
			path: `/publishing/v2/channels/${channel}/current_episode/${episode}`,
			body: {
				data: {
					type: 'Episode',
					attributes,
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Set current episode succeeded but no data was returned.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});