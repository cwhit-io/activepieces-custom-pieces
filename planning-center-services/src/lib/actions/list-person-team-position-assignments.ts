import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listPersonTeamPositionAssignmentsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_person_team_position_assignments',
	displayName: 'List Person Team Position Assignments',
	description:
		'Lists team position eligibility for a person before scheduling.',
	audience: 'both',
	aiMetadata: {
		description:
			'List person team position assignments for a person. Use to check which teams and positions a volunteer is eligible for before scheduling. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		person_search: planningCenterCommon.personSearch,
		person: planningCenterCommon.personDropdown,
		page_size: planningCenterCommon.pageSize,
		max_results: planningCenterCommon.maxResults,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { person, page_size, max_results, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		const queryParams: Record<string, string> = {};
		if (page_size) {
			queryParams['per_page'] = String(page_size);
		}
		const maxResults = max_results ? Number(max_results) : undefined;

		return await planningCenterClient.listResources({
			credentials,
			path: `/services/v2/people/${person}/person_team_position_assignments`,
			queryParams,
			fetchAll,
			maxResults,
		});
	},
});