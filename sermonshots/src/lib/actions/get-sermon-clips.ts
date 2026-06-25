import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { sermonshotsAuth } from '../auth';
import { sermonshotsClient } from '../common/client';
import { sermonshotsCommon } from '../common/props';

export const getSermonClipsAction = createAction({
	auth: sermonshotsAuth,
	name: 'get_sermon_clips',
	displayName: 'Get Sermon Clips',
	description: 'Gets generated video clips for a sermon.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get video clips for a sermon with URLs and timestamps. Use for social media clip distribution. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		video: sermonshotsCommon.videoDropdown,
	},
	async run(context) {
		const authToken = sermonshotsClient.tokenFromAuth(context.auth);
		const { video } = context.propsValue;

		const response = await sermonshotsClient.apiCall<Record<string, unknown>[]>({
			authToken,
			method: HttpMethod.GET,
			path: `/api/v1/video/${video}/clips`,
		});

		return sermonshotsClient.flattenRecords(response.body);
	},
});