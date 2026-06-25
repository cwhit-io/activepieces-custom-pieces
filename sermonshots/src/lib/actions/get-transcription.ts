import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { sermonshotsAuth } from '../auth';
import { sermonshotsClient } from '../common/client';
import { sermonshotsCommon } from '../common/props';

export const getTranscriptionAction = createAction({
	auth: sermonshotsAuth,
	name: 'get_transcription',
	displayName: 'Get Transcription',
	description: 'Gets the full transcription for a sermon video.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get the sermon transcription for a video. Use for captions, search, or content repurposing. Read-only and safe to retry.',
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
			path: `/api/v1/video/${video}/transcription`,
		});

		return sermonshotsClient.flattenRecord(response.body);
	},
});