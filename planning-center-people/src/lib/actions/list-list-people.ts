import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listListPeopleAction = createAction({
	auth: planningCenterAuth,
	name: 'list_list_people',
	displayName: 'List List People',
	description: 'Lists people in a specific list.',
	audience: 'both',
	aiMetadata: {
		description: 'List members of a People list. Use for list-based workflow triggers and exports. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		list: planningCenterCommon.listDropdown,
		page_size: planningCenterCommon.pageSize,
		max_results: planningCenterCommon.maxResults,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { list, page_size, max_results, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		const queryParams: Record<string, string> = {};
		if (page_size) {
			queryParams['per_page'] = String(page_size);
		}
		const maxResults = max_results ? Number(max_results) : undefined;

		return await planningCenterClient.listResources({
			credentials,
			path: `/people/v2/lists/${context.propsValue.list}/people`,
			queryParams,
			fetchAll,
			maxResults,
		});
	},
});
