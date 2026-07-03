import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest, normalizeVideoId, videoIdNumber } from '../common';

type VimeoVideoResponse = {
	uri?: string;
	name?: string;
	description?: string;
	link?: string;
	modified_time?: string;
};

export const updateVideo = createAction({
	auth: vimeoAuth,
	name: 'update_video',
	displayName: 'Update Video',
	description: 'Update the title and/or description of an existing video.',
	audience: 'both',
	aiMetadata: {
		description:
			'Patches an owned Vimeo video name (title) and/or description. At least one field must be provided. Requires edit scope. Idempotent when setting the same values.',
		idempotent: true,
	},
	props: {
		videoId: videoIdNumber,
		name: Property.ShortText({
			displayName: 'Title',
			description: 'New video title. Leave empty to keep the current title.',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description:
				'New video description. Leave empty to keep the current description.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const videoId = normalizeVideoId({ input: propsValue.videoId });
		const { name, description } = propsValue;

		const hasName = typeof name === 'string' && name.trim().length > 0;
		const hasDescription =
			typeof description === 'string' && description.length > 0;

		if (!hasName && !hasDescription) {
			throw new Error('Provide at least a title or description to update.');
		}

		const patchBody: Record<string, string> = {};
		if (hasName) {
			patchBody['name'] = name.trim();
		}
		if (hasDescription) {
			patchBody['description'] = description;
		}

		const response = await apiRequest({
			auth,
			path: `/videos/${videoId}`,
			method: HttpMethod.PATCH,
			body: patchBody,
		});

		const body = response.body as VimeoVideoResponse;

		return {
			video_id: videoId,
			uri: body.uri,
			name: body.name,
			description: body.description,
			link: body.link,
			modified_time: body.modified_time,
			updated_fields: Object.keys(patchBody),
		};
	},
});