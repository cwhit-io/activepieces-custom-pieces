import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { sermonshotsAuth } from '../auth';
import { sermonshotsClient } from '../common/client';
import { sermonshotsCommon } from '../common/props';

export const getDiscussionGuideAction = createAction({
	auth: sermonshotsAuth,
	name: 'get_discussion_guide',
	displayName: 'Get Discussion Guide',
	description: 'Gets the AI-generated small group discussion guide for a sermon.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get a discussion guide for a sermon video. Use for small group or Bible study handouts. Read-only and safe to retry.',
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
			path: `/api/v1/video/${video}/discussion-guide`,
		});

		return sermonshotsClient.flattenRecord(response.body);
	},
});