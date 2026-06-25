import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { sermonshotsAuth } from '../auth';
import { sermonshotsClient } from '../common/client';
import { sermonshotsCommon } from '../common/props';

export const getDownloadableAction = createAction({
	auth: sermonshotsAuth,
	name: 'get_downloadable',
	displayName: 'Get Downloadable Content',
	description: 'Gets downloadable media for a sermon video by type.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get downloadable content by type (e.g. clips, quote, thumbnail). Optionally include related projects. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		video: sermonshotsCommon.videoDropdown,
		downloadable_type: sermonshotsCommon.downloadableType,
		with_projects: sermonshotsCommon.withProjects,
	},
	async run(context) {
		const authToken = sermonshotsClient.tokenFromAuth(context.auth);
		const { video, downloadable_type, with_projects } = context.propsValue;

		const queryParams: Record<string, string | number | boolean> = {};
		if (with_projects) {
			queryParams['withProjects'] = true;
		}

		const response = await sermonshotsClient.apiCall<Record<string, unknown>>({
			authToken,
			method: HttpMethod.GET,
			path: `/api/v1/video/${video}/downloadable/${downloadable_type}`,
			queryParams,
		});

		return sermonshotsClient.flattenRecord(response.body);
	},
});