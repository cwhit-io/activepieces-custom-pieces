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

export const uploadVideoStreamingAction = createAction({
	auth: sermonshotsAuth,
	name: 'upload_video_streaming',
	displayName: 'Upload Video (HLS/DASH)',
	description:
		'Uploads a sermon video from an HLS or DASH streaming source URL.',
	audience: 'both',
	aiMetadata: {
		description:
			'Upload a video from an HLS or DASH manifest URL. Use for streaming sources instead of direct MP4 files. Not idempotent — may create duplicate uploads if retried.',
		idempotent: false,
	},
	props: {
		streaming_source: sermonshotsCommon.streamingSource,
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
			streaming_source,
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
			path: `/api/v1/video/upload/${streaming_source}`,
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