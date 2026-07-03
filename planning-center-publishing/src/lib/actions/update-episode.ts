import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';

type JsonApiSingleResponse = {
	data?: {
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	};
};

export const updateEpisodeAction = createAction({
	auth: planningCenterAuth,
	name: 'update_episode',
	displayName: 'Update Episode',
	description:
		'Patch a Publishing episode title, description, video URLs, stream type, and related fields.',
	audience: 'both',
	aiMetadata: {
		description:
			'Updates a Planning Center Publishing episode via PATCH. Provide the episode ID and at least one field to change (title, description, video_url, library_video_url, etc.).',
		idempotent: true,
	},
	props: {
		episode_id: Property.ShortText({
			displayName: 'Episode ID',
			description:
				'Publishing episode ID (from List Episodes, Get Episode, or Get Latest Sunday Episode).',
			required: true,
		}),
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
		library_video_url: Property.ShortText({
			displayName: 'Library Video URL',
			description: 'Sermon library video URL. Leave empty to keep unchanged.',
			required: false,
		}),
		library_audio_url: Property.ShortText({
			displayName: 'Library Audio URL',
			description: 'Sermon library audio URL. Leave empty to keep unchanged.',
			required: false,
		}),
		stream_type: Property.StaticDropdown({
			displayName: 'Stream Type',
			description: 'How the episode is streamed. Leave empty to keep unchanged.',
			required: false,
			options: {
				options: [
					{
						label: 'Channel default livestream',
						value: 'channel_default_livestream',
					},
					{ label: 'Livestream', value: 'livestream' },
					{ label: 'Prerecorded', value: 'prerecorded' },
				],
			},
		}),
		published_to_library_at: Property.DateTime({
			displayName: 'Published to Library At',
			description:
				'When the episode was published to the sermon library. Leave empty to keep unchanged.',
			required: false,
		}),
		series_id: Property.ShortText({
			displayName: 'Series ID',
			description: 'Move episode to a different series by ID. Leave empty to keep unchanged.',
			required: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			episode_id: episodeId,
			title,
			description,
			video_url: videoUrl,
			library_video_url: libraryVideoUrl,
			library_audio_url: libraryAudioUrl,
			stream_type: streamType,
			published_to_library_at: publishedToLibraryAt,
			series_id: seriesId,
		} = context.propsValue;

		const attributes = buildEpisodeAttributes({
			title,
			description,
			videoUrl,
			libraryVideoUrl,
			libraryAudioUrl,
			streamType,
			publishedToLibraryAt,
			seriesId,
		});

		const body: EpisodePatchBody = {
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
			method: HttpMethod.PATCH,
			path: `/publishing/v2/episodes/${episodeId.trim()}`,
			body,
		});

		if (!response.body.data) {
			throw new Error('Episode update succeeded but no data was returned.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});

function buildEpisodeAttributes({
	title,
	description,
	videoUrl,
	libraryVideoUrl,
	libraryAudioUrl,
	streamType,
	publishedToLibraryAt,
	seriesId,
}: {
	title?: string;
	description?: string;
	videoUrl?: string;
	libraryVideoUrl?: string;
	libraryAudioUrl?: string;
	streamType?: string;
	publishedToLibraryAt?: string;
	seriesId?: string;
}): Record<string, unknown> {
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
	if (typeof libraryVideoUrl === 'string' && libraryVideoUrl.trim().length > 0) {
		attributes['library_video_url'] = libraryVideoUrl.trim();
	}
	if (typeof libraryAudioUrl === 'string' && libraryAudioUrl.trim().length > 0) {
		attributes['library_audio_url'] = libraryAudioUrl.trim();
	}
	if (typeof streamType === 'string' && streamType.length > 0) {
		attributes['stream_type'] = streamType;
	}
	if (
		typeof publishedToLibraryAt === 'string' &&
		publishedToLibraryAt.length > 0
	) {
		attributes['published_to_library_at'] = publishedToLibraryAt;
	}

	const hasSeriesId = typeof seriesId === 'string' && seriesId.trim().length > 0;
	if (Object.keys(attributes).length === 0 && !hasSeriesId) {
		throw new Error(
			'Provide at least one field to update (title, description, video URL, series ID, etc.).',
		);
	}

	return attributes;
}

type EpisodePatchBody = {
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