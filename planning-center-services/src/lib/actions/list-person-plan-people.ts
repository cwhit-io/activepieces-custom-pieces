import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listPersonPlanPeopleAction = createAction({
	auth: planningCenterAuth,
	name: 'list_person_plan_people',
	displayName: 'List Person Plan People',
	description:
		'Lists all plan assignments for a person (what they are scheduled for).',
	audience: 'both',
	aiMetadata: {
		description:
			'List plan people for a person via GET /people/{id}/plan_people. Use to answer "what is Jane scheduled for?" across all plans. Read-only and safe to retry.',
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
			path: `/services/v2/people/${person}/plan_people`,
			queryParams,
			fetchAll,
			maxResults,
		});
	},
});