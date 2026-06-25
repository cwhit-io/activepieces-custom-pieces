import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { sermonshotsAuth } from '../auth';
import { sermonshotsClient } from '../common/client';
import { sermonshotsCommon } from '../common/props';

export const getSummaryAction = createAction({
	auth: sermonshotsAuth,
	name: 'get_summary',
	displayName: 'Get Summary',
	description:
		'Gets AI-generated sermon summaries (short, long, YouTube, and social media).',
	audience: 'both',
	aiMetadata: {
		description:
			'Get AI sermon summaries for a video. Use for publishing teasers or show notes. Read-only and safe to retry.',
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
			path: `/api/v1/video/${video}/summary`,
		});

		return sermonshotsClient.flattenRecord(response.body);
	},
});