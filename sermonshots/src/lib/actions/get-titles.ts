import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { sermonshotsAuth } from '../auth';
import { sermonshotsClient } from '../common/client';
import { sermonshotsCommon } from '../common/props';

export const getTitlesAction = createAction({
	auth: sermonshotsAuth,
	name: 'get_titles',
	displayName: 'Get Title Suggestions',
	description: 'Gets AI-generated title suggestions for a sermon video.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get title suggestions for a sermon video. Use when publishing to YouTube or social platforms. Read-only and safe to retry.',
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
			path: `/api/v1/video/${video}/titles`,
		});

		return sermonshotsClient.flattenRecords(response.body);
	},
});