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
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { list, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		return await planningCenterClient.listResources({
			credentials,
			path: `/people/v2/lists/${list}/people`,
			
			fetchAll,
		});
	},
});
