import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest, normalizeVideoId, videoIdNumber } from '../common';

export const copyVideo = createAction({
	auth: vimeoAuth,
	name: 'copy_video',
	displayName: 'Copy Video',
	description: 'Creates a copy of one of your videos.',
	audience: 'both',
	aiMetadata: {
		description:
			'Copies a Vimeo video owned by the authenticated user. Not idempotent: each call creates a new copy.',
		idempotent: false,
	},
	props: {
		videoId: videoIdNumber,
		name: Property.ShortText({
			displayName: 'Copy Name',
			description:
				'Name for the copied video. Defaults to the source name with (Copy) appended.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const videoId = normalizeVideoId({ input: propsValue.videoId });
		const body: Record<string, string> = {};
		if (propsValue.name?.trim()) {
			body['name'] = propsValue.name.trim();
		}

		const response = await apiRequest({
			auth,
			path: `/me/videos/${videoId}/copy`,
			method: HttpMethod.POST,
			body: Object.keys(body).length > 0 ? body : undefined,
		});

		return response.body;
	},
});