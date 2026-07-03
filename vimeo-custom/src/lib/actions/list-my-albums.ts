import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import {
	apiRequest,
	buildPaginationQuery,
	paginationProps,
} from '../common';

export const listMyAlbums = createAction({
	auth: vimeoAuth,
	name: 'list_my_albums',
	displayName: 'List My Albums',
	description: 'Lists showcases (albums) on your Vimeo account.',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists the authenticated user\'s Vimeo showcases (albums). Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		...paginationProps,
	},
	async run({ auth, propsValue }) {
		const response = await apiRequest({
			auth,
			path: '/me/albums',
			method: HttpMethod.GET,
			queryParams: buildPaginationQuery({
				page: propsValue.page,
				perPage: propsValue.perPage,
			}),
		});

		return response.body;
	},
});