import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import {
	apiRequest,
	normalizeVideoId,
	textTrackDropdown,
	videoIdNumber,
} from '../common';

export const getTranscript = createAction({
	auth: vimeoAuth,
	name: 'get_transcript',
	displayName: 'Get Transcript',
	description: 'Fetches transcript segments for a text track.',
	audience: 'both',
	aiMetadata: {
		description:
			'Returns transcript segments for a Vimeo video text track. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		videoId: videoIdNumber,
		textTrackId: textTrackDropdown,
	},
	async run({ auth, propsValue }) {
		const videoId = normalizeVideoId({ input: propsValue.videoId });
		const { textTrackId } = propsValue;

		const response = await apiRequest({
			auth,
			path: `/videos/${videoId}/transcripts/${textTrackId}`,
			method: HttpMethod.GET,
		});

		return response.body;
	},
});