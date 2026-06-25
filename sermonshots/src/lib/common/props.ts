import { Property } from '@activepieces/pieces-framework';
import { sermonshotsAuth } from '../auth';
import { sermonshotsClient } from './client';

const LANGUAGE_OPTIONS = [
	{ label: 'English', value: 'english' },
	{ label: 'Dutch', value: 'dutch' },
	{ label: 'French', value: 'french' },
	{ label: 'Finnish', value: 'finnish' },
	{ label: 'German', value: 'german' },
	{ label: 'Portuguese', value: 'portuguese' },
	{ label: 'Russian', value: 'russian' },
	{ label: 'Spanish', value: 'spanish' },
	{ label: 'Turkish', value: 'turkish' },
];

export const sermonshotsCommon = {
	videoDropdown: Property.Dropdown({
		displayName: 'Video',
		description:
			'The sermon video to use. Videos are listed by title from your SermonShots account.',
		auth: sermonshotsAuth,
		refreshers: [],
		required: true,
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Connect your SermonShots account first',
				};
			}

			try {
				const authToken = sermonshotsClient.tokenFromAuth(auth);
				const options = await sermonshotsClient.fetchVideoOptions({ authToken });

				return {
					disabled: false,
					options,
				};
			} catch {
				return {
					disabled: true,
					options: [],
					placeholder: 'Failed to load videos. Check your API token.',
				};
			}
		},
	}),

	page: Property.Number({
		displayName: 'Page',
		description: 'Page number for pagination (starts at 1).',
		required: false,
		defaultValue: 1,
	}),

	limit: Property.Number({
		displayName: 'Limit',
		description: 'Number of videos per page.',
		required: false,
		defaultValue: 10,
	}),

	sortOrder: Property.StaticDropdown({
		displayName: 'Sort Order',
		description: 'Sort videos by creation date.',
		required: false,
		defaultValue: 'DESC',
		options: {
			options: [
				{ label: 'Newest First', value: 'DESC' },
				{ label: 'Oldest First', value: 'ASC' },
			],
		},
	}),

	fetchAllPages: Property.Checkbox({
		displayName: 'Fetch All Pages',
		description:
			'When enabled, automatically fetches every page of video results.',
		required: false,
		defaultValue: true,
	}),

	imageType: Property.ShortText({
		displayName: 'Image Type',
		description:
			'The image type to retrieve (e.g. thumbnail, quote).',
		required: true,
	}),

	downloadableType: Property.ShortText({
		displayName: 'Downloadable Type',
		description:
			'The downloadable content type (e.g. clips, quote, thumbnail).',
		required: true,
	}),

	withProjects: Property.Checkbox({
		displayName: 'Include Projects',
		description: 'Include related image and clip projects in the response.',
		required: false,
		defaultValue: false,
	}),

	uploadLanguage: Property.StaticDropdown({
		displayName: 'Language',
		description: 'The spoken language of the sermon video.',
		required: true,
		options: {
			options: LANGUAGE_OPTIONS,
		},
	}),

	publicUrl: Property.ShortText({
		displayName: 'Public Video URL',
		description:
			'A publicly accessible URL to the video file (MP4, HLS, or DASH manifest).',
		required: true,
	}),

	filename: Property.ShortText({
		displayName: 'Filename',
		description: 'Filename to use for the uploaded video (e.g. sermon-2024-01-15.mp4).',
		required: true,
	}),

	reencode: Property.Checkbox({
		displayName: 'Re-encode Video',
		description:
			'When enabled, SermonShots optimizes and re-encodes the video during upload.',
		required: false,
		defaultValue: false,
	}),

	trimStart: Property.Number({
		displayName: 'Trim Start (seconds)',
		description: 'Optional start time in seconds for trimming the video.',
		required: false,
	}),

	trimEnd: Property.Number({
		displayName: 'Trim End (seconds)',
		description: 'Optional end time in seconds for trimming the video.',
		required: false,
	}),

	streamingSource: Property.StaticDropdown({
		displayName: 'Streaming Source',
		description: 'The streaming format of the source URL.',
		required: true,
		options: {
			options: [
				{ label: 'HLS', value: 'hls' },
				{ label: 'DASH', value: 'dash' },
			],
		},
	}),

	churchName: Property.ShortText({
		displayName: 'Church Name',
		description:
			'The church slug used in public URLs (e.g. first-baptist).',
		required: true,
	}),
};