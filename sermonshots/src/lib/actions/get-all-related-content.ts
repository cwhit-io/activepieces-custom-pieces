import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { sermonshotsAuth } from '../auth';
import { sermonshotsClient } from '../common/client';
import { sermonshotsCommon } from '../common/props';

export const getAllRelatedContentAction = createAction({
	auth: sermonshotsAuth,
	name: 'get_all_related_content',
	displayName: 'Get All Related Content',
	description:
		'Gets all AI-generated content for a video (summary, blog, quotes, transcription, etc.).',
	audience: 'both',
	aiMetadata: {
		description:
			'Fetch every generated asset for a video in one call (summary, blog, devotionals, quotes, titles, discussion guide, transcription). Use when you need the full content bundle. Read-only and safe to retry.',
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
			path: `/api/v1/video/${video}/all`,
		});

		return sermonshotsClient.flattenRelatedContent(response.body);
	},
});