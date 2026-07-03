import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import {
	apiRequest,
	buildPaginationQuery,
	paginationProps,
} from '../common';

export const listTeamProjects = createAction({
	auth: vimeoAuth,
	name: 'list_team_projects',
	displayName: 'List Team Projects',
	description: 'Lists folders (projects) for a Vimeo team account.',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists folders (projects) for a Vimeo team using GET /users/{user_id}/projects. The team user ID is the numeric owner account ID (not /me/teams, which is not in the API). Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		teamUserId: Property.ShortText({
			displayName: 'Team User ID',
			description:
				'Numeric Vimeo user ID for the team owner account. Find this in team settings or from metadata.connections.teams on GET /me.',
			required: true,
		}),
		...paginationProps,
	},
	async run({ auth, propsValue }) {
		const teamUserId = propsValue.teamUserId.trim().replace(/\D/g, '');
		if (!teamUserId) {
			throw new Error('Team user ID is required.');
		}

		const response = await apiRequest({
			auth,
			path: `/users/${teamUserId}/projects`,
			method: HttpMethod.GET,
			queryParams: buildPaginationQuery({
				page: propsValue.page,
				perPage: propsValue.perPage,
			}),
		});

		return response.body;
	},
});