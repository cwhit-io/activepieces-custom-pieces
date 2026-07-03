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

export const getVideoVersions = createAction({
	auth: vimeoAuth,
	name: 'get_video_versions',
	displayName: 'Get Video Versions',
	description: 'Lists all versions of a video.',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists version history entries for a Vimeo video. Read-only and safe to retry.',
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
			path: `/videos/${videoId}/versions`,
			method: HttpMethod.GET,
			queryParams: buildPaginationQuery({
				page: propsValue.page,
				perPage: propsValue.perPage,
			}),
		});

		return response.body;
	},
});