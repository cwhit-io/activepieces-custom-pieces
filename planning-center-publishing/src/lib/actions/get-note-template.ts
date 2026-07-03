import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

type JsonApiSingleResponse = {
	data?: {
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	};
};

export const getNoteTemplateAction = createAction({
	auth: planningCenterAuth,
	name: 'get_note_template',
	displayName: 'Get Note Template',
	description: 'Gets the sermon notes template for an episode.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get the note template structure and content for a Publishing episode. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		episode: planningCenterCommon.episodeDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { episode } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/publishing/v2/episodes/${episode}/note_template`,
		});

		if (!response.body.data) {
			throw new Error('Note template not found.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});