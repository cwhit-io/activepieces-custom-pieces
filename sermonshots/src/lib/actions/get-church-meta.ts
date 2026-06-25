import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { sermonshotsAuth } from '../auth';
import { sermonshotsClient } from '../common/client';
import { sermonshotsCommon } from '../common/props';

export const getChurchMetaAction = createAction({
	auth: sermonshotsAuth,
	name: 'get_church_meta',
	displayName: 'Get Church Metadata',
	description:
		'Retrieves public metadata for a church (name, description, logo).',
	audience: 'both',
	aiMetadata: {
		description:
			'Get public church profile metadata by church slug. Use for branding or public page lookups. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		church_name: sermonshotsCommon.churchName,
	},
	async run(context) {
		const { church_name } = context.propsValue;

		const response = await sermonshotsClient.apiCall<Record<string, unknown>>({
			method: HttpMethod.GET,
			path: `/api/v1/public/church/${church_name}`,
			includeAuth: false,
		});

		return sermonshotsClient.flattenRecord(response.body);
	},
});