import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { sermonshotsAuth } from '../auth';
import { sermonshotsClient } from '../common/client';
import { sermonshotsCommon } from '../common/props';

function buildUploadBody({
	public_url,
	filename,
	language,
	reencode,
	trim_start,
	trim_end,
}: {
	public_url: string;
	filename: string;
	language: string;
	reencode: boolean;
	trim_start?: number;
	trim_end?: number;
}): Record<string, unknown> {
	const body: Record<string, unknown> = {
		publicUrl: public_url,
		filename,
		language,
		reencode,
	};

	if (trim_start !== undefined) {
		body['start'] = trim_start;
	}

	if (trim_end !== undefined) {
		body['end'] = trim_end;
	}

	return body;
}

export const uploadVideoAction = createAction({
	auth: sermonshotsAuth,
	name: 'upload_video',
	displayName: 'Upload Video',
	description: 'Uploads a sermon video from a public URL for processing.',
	audience: 'both',
	aiMetadata: {
		description:
			'Upload a video from a public URL to SermonShots. Triggers transcription and AI content generation. Not idempotent — may create duplicate uploads if retried.',
		idempotent: false,
	},
	props: {
		public_url: sermonshotsCommon.publicUrl,
		filename: sermonshotsCommon.filename,
		language: sermonshotsCommon.uploadLanguage,
		reencode: sermonshotsCommon.reencode,
		trim_start: sermonshotsCommon.trimStart,
		trim_end: sermonshotsCommon.trimEnd,
	},
	async run(context) {
		const authToken = sermonshotsClient.tokenFromAuth(context.auth);
		const {
			public_url,
			filename,
			language,
			reencode,
			trim_start,
			trim_end,
		} = context.propsValue;

		const response = await sermonshotsClient.apiCall<Record<string, unknown>>({
			authToken,
			method: HttpMethod.POST,
			path: '/api/v1/video/upload',
			body: buildUploadBody({
				public_url,
				filename,
				language,
				reencode: reencode ?? false,
				trim_start,
				trim_end,
			}),
		});

		return sermonshotsClient.flattenRecord(response.body);
	},
});