import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { sermonshotsAuth } from '../auth';
import { sermonshotsClient } from '../common/client';
import { sermonshotsCommon } from '../common/props';

export const getQuotesAction = createAction({
	auth: sermonshotsAuth,
	name: 'get_quotes',
	displayName: 'Get Quotes',
	description: 'Gets notable quotes extracted from a sermon video.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get quote highlights from a sermon video. Use for social graphics or promotional content. Read-only and safe to retry.',
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
			path: `/api/v1/video/${video}/quotes`,
		});

		return sermonshotsClient.flattenRecords(response.body);
	},
});