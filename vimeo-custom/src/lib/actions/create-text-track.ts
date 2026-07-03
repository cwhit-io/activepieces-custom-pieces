import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest, normalizeVideoId, videoIdNumber } from '../common';

type TextTrackResponse = {
	uri?: string;
	id?: number;
	link?: string;
	name?: string;
	language?: string;
	type?: string;
};

export const createTextTrack = createAction({
	auth: vimeoAuth,
	name: 'create_text_track',
	displayName: 'Create Text Track',
	description: 'Adds a caption or subtitle track to a video.',
	audience: 'both',
	aiMetadata: {
		description:
			'Creates a text track on a Vimeo video. Optionally uploads a VTT/SRT file from a URL to the track upload link. Not idempotent: each call creates a new track.',
		idempotent: false,
	},
	props: {
		videoId: videoIdNumber,
		name: Property.ShortText({
			displayName: 'Track Name',
			description: 'Display name for the text track.',
			required: true,
		}),
		language: Property.ShortText({
			displayName: 'Language',
			description: 'Language code (e.g. en-US).',
			required: true,
		}),
		type: Property.StaticDropdown({
			displayName: 'Track Type',
			description: 'Type of text track.',
			required: true,
			defaultValue: 'captions',
			options: {
				options: [
					{ value: 'captions', label: 'Captions' },
					{ value: 'subtitles', label: 'Subtitles' },
					{ value: 'chapters', label: 'Chapters' },
					{ value: 'descriptions', label: 'Descriptions' },
					{ value: 'metadata', label: 'Metadata' },
				],
			},
		}),
		active: Property.Checkbox({
			displayName: 'Active',
			description:
				'Whether this track is the active track for its language and type.',
			required: false,
			defaultValue: true,
		}),
		trackFileUrl: Property.ShortText({
			displayName: 'Track File URL',
			description:
				'Optional URL to a VTT or SRT file. When provided, the file is uploaded to Vimeo after the track is created.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const videoId = normalizeVideoId({ input: propsValue.videoId });

		const response = await apiRequest({
			auth,
			path: `/videos/${videoId}/texttracks`,
			method: HttpMethod.POST,
			body: {
				name: propsValue.name,
				language: propsValue.language,
				type: propsValue.type,
				active: propsValue.active ?? true,
			},
		});

		const track = response.body as TextTrackResponse;

		if (propsValue.trackFileUrl?.trim() && track.link) {
			const fileResponse = await httpClient.sendRequest({
				method: HttpMethod.GET,
				url: propsValue.trackFileUrl.trim(),
				responseType: 'text',
			});

			await httpClient.sendRequest({
				method: HttpMethod.PUT,
				url: track.link,
				body: fileResponse.body,
				headers: {
					'Content-Type': 'text/vtt',
				},
			});
		}

		return {
			...track,
			file_uploaded: Boolean(propsValue.trackFileUrl?.trim()),
		};
	},
});