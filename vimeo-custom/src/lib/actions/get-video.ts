import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest, normalizeVideoId, videoIdNumber } from '../common';

export const getVideo = createAction({
	auth: vimeoAuth,
	name: 'get_video',
	displayName: 'Get Video',
	description: 'Fetches full metadata for a Vimeo video.',
	audience: 'both',
	aiMetadata: {
		description:
			'Returns Vimeo video metadata for a video ID. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		videoId: videoIdNumber,
		fields: Property.ShortText({
			displayName: 'Fields',
			description:
				'Optional comma-separated list of fields to return (Vimeo fields filter). Leave empty for the default response.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const videoId = normalizeVideoId({ input: propsValue.videoId });
		const queryParams: Record<string, string> = {};
		if (propsValue.fields?.trim()) {
			queryParams['fields'] = propsValue.fields.trim();
		}

		const response = await apiRequest({
			auth,
			path: `/videos/${videoId}`,
			method: HttpMethod.GET,
			queryParams,
		});

		return response.body;
	},
});