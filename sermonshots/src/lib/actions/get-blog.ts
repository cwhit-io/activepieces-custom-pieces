import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { sermonshotsAuth } from '../auth';
import { sermonshotsClient } from '../common/client';
import { sermonshotsCommon } from '../common/props';

export const getBlogAction = createAction({
	auth: sermonshotsAuth,
	name: 'get_blog',
	displayName: 'Get Blog Post',
	description: 'Gets the AI-generated blog post for a sermon video.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get the AI blog post for a video. Use when publishing sermon recaps to a website. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		video: sermonshotsCommon.videoDropdown,
	},
	async run(context) {
		const authToken = sermonshotsClient.tokenFromAuth(context.auth);
		const { video } = context.propsValue;

		const response = await sermonshotsClient.apiCall<Record<string, unknown>>({
			authToken,
			method: HttpMethod.GET,
			path: `/api/v1/video/${video}/blog`,
		});

		return sermonshotsClient.flattenRecord(response.body);
	},
});