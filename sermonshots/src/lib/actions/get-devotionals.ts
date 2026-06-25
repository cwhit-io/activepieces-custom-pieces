import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { sermonshotsAuth } from '../auth';
import { sermonshotsClient } from '../common/client';
import { sermonshotsCommon } from '../common/props';

export const getDevotionalsAction = createAction({
	auth: sermonshotsAuth,
	name: 'get_devotionals',
	displayName: 'Get Devotionals',
	description: 'Gets AI-generated daily devotionals based on a sermon video.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get devotionals generated from a sermon video. Returns an array of daily devotional content. Read-only and safe to retry.',
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
			path: `/api/v1/video/${video}/devotionals`,
		});

		return sermonshotsClient.flattenRecords(response.body);
	},
});