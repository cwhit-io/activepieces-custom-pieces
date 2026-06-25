import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { sermonshotsAuth } from '../auth';
import { sermonshotsClient } from '../common/client';
import { sermonshotsCommon } from '../common/props';

export const getVideoAction = createAction({
	auth: sermonshotsAuth,
	name: 'get_video',
	displayName: 'Get Video',
	description:
		'Gets detailed information about a single sermon video including status and files.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get one video by ID including upload status, metadata, and file URLs. Use to check processing progress. Read-only and safe to retry.',
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
			path: `/api/v1/video/${video}`,
		});

		return sermonshotsClient.flattenRecord(response.body);
	},
});