import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listListsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_lists',
	displayName: 'List Lists',
	description: 'Lists dynamic and static people lists.',
	audience: 'both',
	aiMetadata: {
		description: 'List People lists. Use before pulling list membership for automations. Read-only and safe to retry.',
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
			path: '/people/v2/lists',
			
			fetchAll,
		});
	},
});
