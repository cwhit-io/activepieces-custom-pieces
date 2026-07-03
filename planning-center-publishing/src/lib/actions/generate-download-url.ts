import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const generateDownloadUrlAction = createAction({
	auth: planningCenterAuth,
	name: 'generate_download_url',
	displayName: 'Generate Download URL',
	description:
		'Generates a secure download URL for an episode.',
	audience: 'both',
	aiMetadata: {
		description:
			'Generate a secure download URL for a Publishing episode. Each call may create a new URL.',
		idempotent: false,
	},
	props: {
		episode: planningCenterCommon.episodeDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { episode } = context.propsValue;

		const response = await planningCenterClient.apiCall<Record<string, unknown>>({
			credentials,
			method: HttpMethod.POST,
			path: `/publishing/v2/episodes/${episode}/generate_download_url`,
		});

		return response.body;
	},
});