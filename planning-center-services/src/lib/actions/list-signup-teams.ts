import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listSignupTeamsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_signup_teams',
	displayName: 'List Signup Teams',
	description: 'Lists teams with open signup sheets on a plan.',
	audience: 'both',
	aiMetadata: {
		description:
			'List signup teams on a plan. Use to discover open volunteer signup opportunities for a service date. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		service_type: planningCenterCommon.serviceTypeDropdown,
		plan: planningCenterCommon.planDropdown,
		page_size: planningCenterCommon.pageSize,
		max_results: planningCenterCommon.maxResults,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { service_type, plan, page_size, max_results, fetch_all_pages } =
			context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		const queryParams: Record<string, string> = {};
		if (page_size) {
			queryParams['per_page'] = String(page_size);
		}
		const maxResults = max_results ? Number(max_results) : undefined;

		return await planningCenterClient.listResources({
			credentials,
			path: `/services/v2/service_types/${service_type}/plans/${plan}/signup_teams`,
			queryParams,
			fetchAll,
			maxResults,
		});
	},
});