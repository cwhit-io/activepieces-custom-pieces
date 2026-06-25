import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listGroupsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_groups',
	displayName: 'List Groups',
	description: 'Lists all groups.',
	audience: 'both',
	aiMetadata: {
		description: 'List Planning Center groups. Use to discover group_id values and metadata. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const fetchAll = context.propsValue.fetch_all_pages ?? true;

		return await planningCenterClient.listResources({
			credentials,
			path: '/groups/v2/groups',
			
			fetchAll,
		});
	},
});
