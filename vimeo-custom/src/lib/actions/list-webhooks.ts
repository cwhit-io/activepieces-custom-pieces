import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import {
	apiRequest,
	buildPaginationQuery,
	paginationProps,
} from '../common';

export const listWebhooks = createAction({
	auth: vimeoAuth,
	name: 'list_webhooks',
	displayName: 'List Webhooks',
	description: 'Lists webhooks registered for your Vimeo developer app.',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists webhooks for a Vimeo developer app. Requires the app ID from developer.vimeo.com/apps. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		appId: Property.ShortText({
			displayName: 'App ID',
			description:
				'Numeric ID of your Vimeo developer app (from developer.vimeo.com/apps).',
			required: true,
		}),
		...paginationProps,
	},
	async run({ auth, propsValue }) {
		const appId = propsValue.appId.trim().replace(/\D/g, '');
		if (!appId) {
			throw new Error('App ID is required.');
		}

		const response = await apiRequest({
			auth,
			path: `/apps/${appId}/webhooks`,
			method: HttpMethod.GET,
			queryParams: buildPaginationQuery({
				page: propsValue.page,
				perPage: propsValue.perPage,
			}),
		});

		return response.body;
	},
});