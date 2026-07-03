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

export const createEpisodeAction = createAction({
	auth: planningCenterAuth,
	name: 'create_episode',
	displayName: 'Create Episode',
	description:
		'Creates a new sermon episode on a publishing channel.',
	audience: 'both',
	aiMetadata: {
		description:
			'Creates a Planning Center Publishing episode via POST on a channel. Each call creates a new episode; retries may duplicate.',
		idempotent: false,
	},
	props: {
		channel: planningCenterCommon.channelDropdown,
		title: Property.ShortText({
			displayName: 'Title',
			description: 'Episode title.',
			required: true,
		}),
		series_id: Property.ShortText({
			displayName: 'Series ID',
			description:
				'Optional series ID to assign the episode to (from List Series or List Channel Series).',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Episode description.',
			required: false,
		}),
		stream_type: planningCenterCommon.streamType,
		video_url: Property.ShortText({
			displayName: 'Video URL',
			description: 'Live/stream video URL.',
			required: false,
		}),
		library_video_url: Property.ShortText({
			displayName: 'Library Video URL',
			description: 'Sermon library video URL.',
			required: false,
		}),
		library_audio_url: Property.ShortText({
			displayName: 'Library Audio URL',
			description: 'Sermon library audio URL.',
			required: false,
		}),
		published_to_library_at: Property.DateTime({
			displayName: 'Published to Library At',
			description: 'When the episode was published to the sermon library.',
			required: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			channel,
			title,
			series_id: seriesId,
			description,
			stream_type: streamType,
			video_url: videoUrl,
			library_video_url: libraryVideoUrl,
			library_audio_url: libraryAudioUrl,
			published_to_library_at: publishedToLibraryAt,
		} = context.propsValue;

		const attributes = buildEpisodeAttributes({
			title,
			description,
			streamType,
			videoUrl,
			libraryVideoUrl,
			libraryAudioUrl,
			publishedToLibraryAt,
		});

		const body: EpisodeCreateBody = {
			data: {
				type: 'Episode',
				attributes,
			},
		};

		if (typeof seriesId === 'string' && seriesId.trim().length > 0) {
			body.data.relationships = {
				series: {
					data: {
						type: 'Series',
						id: seriesId.trim(),
					},
				},
			};
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.POST,
			path: `/publishing/v2/channels/${channel}/episodes`,
			body,
		});

		if (!response.body.data) {
			throw new Error('Episode creation succeeded but no data was returned.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});

function buildEpisodeAttributes({
	title,
	description,
	streamType,
	videoUrl,
	libraryVideoUrl,
	libraryAudioUrl,
	publishedToLibraryAt,
}: {
	title: string;
	description?: string;
	streamType?: string;
	videoUrl?: string;
	libraryVideoUrl?: string;
	libraryAudioUrl?: string;
	publishedToLibraryAt?: string;
}): Record<string, unknown> {
	const attributes: Record<string, unknown> = {
		title: title.trim(),
	};

	if (typeof description === 'string' && description.length > 0) {
		attributes['description'] = description;
	}
	if (typeof streamType === 'string' && streamType.length > 0) {
		attributes['stream_type'] = streamType;
	}
	if (typeof videoUrl === 'string' && videoUrl.trim().length > 0) {
		attributes['video_url'] = videoUrl.trim();
	}
	if (typeof libraryVideoUrl === 'string' && libraryVideoUrl.trim().length > 0) {
		attributes['library_video_url'] = libraryVideoUrl.trim();
	}
	if (typeof libraryAudioUrl === 'string' && libraryAudioUrl.trim().length > 0) {
		attributes['library_audio_url'] = libraryAudioUrl.trim();
	}
	if (
		typeof publishedToLibraryAt === 'string' &&
		publishedToLibraryAt.length > 0
	) {
		attributes['published_to_library_at'] = publishedToLibraryAt;
	}

	return attributes;
}

type EpisodeCreateBody = {
	data: {
		type: string;
		attributes: Record<string, unknown>;
		relationships?: {
			series: {
				data: {
					type: string;
					id: string;
				};
			};
		};
	};
};