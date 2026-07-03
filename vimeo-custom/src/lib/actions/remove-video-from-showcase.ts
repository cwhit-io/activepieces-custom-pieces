import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import {
	apiRequest,
	normalizeVideoId,
	userShowcaseDropdown,
	videoIdNumber,
} from '../common';

export const removeVideoFromShowcase = createAction({
	auth: vimeoAuth,
	name: 'remove_video_from_showcase',
	displayName: 'Remove Video from Showcase',
	description: 'Removes a video from a showcase without deleting the video.',
	audience: 'both',
	aiMetadata: {
		description:
			'Removes a video from a Vimeo showcase (album) by ID. Does not delete the video itself. Idempotent when the video is already absent from the showcase.',
		idempotent: true,
	},
	props: {
		videoId: videoIdNumber,
		showcaseId: userShowcaseDropdown,
	},
	async run({ auth, propsValue }) {
		const videoId = normalizeVideoId({ input: propsValue.videoId });
		const { showcaseId } = propsValue;

		const response = await apiRequest({
			auth,
			path: `/me/albums/${showcaseId}/videos/${videoId}`,
			method: HttpMethod.DELETE,
		});

		if (response.status === 204) {
			return {
				success: true,
				message: `Video '${videoId}' removed from showcase '${showcaseId}' successfully`,
			};
		}

		return {
			success: false,
			status: response.status,
			body: response.body,
		};
	},
});