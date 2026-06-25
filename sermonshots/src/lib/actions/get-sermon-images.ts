import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { sermonshotsAuth } from '../auth';
import { sermonshotsClient } from '../common/client';
import { sermonshotsCommon } from '../common/props';

export const getSermonImagesAction = createAction({
	auth: sermonshotsAuth,
	name: 'get_sermon_images',
	displayName: 'Get Sermon Images',
	description: 'Gets generated images for a sermon video by type.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get sermon images by type (e.g. thumbnail, quote). Returns image URLs for a video. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		video: sermonshotsCommon.videoDropdown,
		image_type: sermonshotsCommon.imageType,
	},
	async run(context) {
		const authToken = sermonshotsClient.tokenFromAuth(context.auth);
		const { video, image_type } = context.propsValue;

		const response = await sermonshotsClient.apiCall<Record<string, unknown>[]>({
			authToken,
			method: HttpMethod.GET,
			path: `/api/v1/video/${video}/images/${image_type}`,
		});

		return sermonshotsClient.flattenRecords(response.body);
	},
});