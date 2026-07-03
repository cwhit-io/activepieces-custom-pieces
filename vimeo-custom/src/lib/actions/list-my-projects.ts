import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import {
	apiRequest,
	buildPaginationQuery,
	paginationProps,
} from '../common';

export const listMyProjects = createAction({
	auth: vimeoAuth,
	name: 'list_my_projects',
	displayName: 'List My Projects',
	description: 'Lists folders (projects) on your Vimeo account.',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists the authenticated user\'s Vimeo folders (projects). Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		...paginationProps,
	},
	async run({ auth, propsValue }) {
		const response = await apiRequest({
			auth,
			path: '/me/projects',
			method: HttpMethod.GET,
			queryParams: buildPaginationQuery({
				page: propsValue.page,
				perPage: propsValue.perPage,
			}),
		});

		return response.body;
	},
});