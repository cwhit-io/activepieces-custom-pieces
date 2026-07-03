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

export const getVideoPictures = createAction({
	auth: vimeoAuth,
	name: 'get_video_pictures',
	displayName: 'Get Video Pictures',
	description: 'Lists thumbnail images for a video.',
	audience: 'both',
	aiMetadata: {
		description:
			'Returns all thumbnail images for a Vimeo video. Read-only and safe to retry.',
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
			path: `/videos/${videoId}/pictures`,
			method: HttpMethod.GET,
			queryParams: buildPaginationQuery({
				page: propsValue.page,
				perPage: propsValue.perPage,
			}),
		});

		return response.body;
	},
});