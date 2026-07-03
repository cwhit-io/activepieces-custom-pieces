import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import {
	apiRequest,
	buildPaginationQuery,
	normalizeVideoId,
	paginationProps,
	videoIdNumber,
} from '../common';

export const listTextTracks = createAction({
	auth: vimeoAuth,
	name: 'list_text_tracks',
	displayName: 'List Text Tracks',
	description: 'Lists caption and subtitle tracks on a video.',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists text tracks (captions, subtitles, etc.) for a Vimeo video. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		videoId: videoIdNumber,
		...paginationProps,
	},
	async run({ auth, propsValue }) {
		const videoId = normalizeVideoId({ input: propsValue.videoId });

		const response = await apiRequest({
			auth,
			path: `/videos/${videoId}/texttracks`,
			method: HttpMethod.GET,
			queryParams: buildPaginationQuery({
				page: propsValue.page,
				perPage: propsValue.perPage,
			}),
		});

		return response.body;
	},
});