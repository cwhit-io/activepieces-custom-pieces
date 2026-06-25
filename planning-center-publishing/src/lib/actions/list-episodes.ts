import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listEpisodesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_episodes',
	displayName: 'List Episodes',
	description: 'Lists sermon episodes.',
	audience: 'both',
	aiMetadata: {
		description: 'List Publishing episodes (sermons) with metadata and media. Read-only and safe to retry.',
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
			path: '/publishing/v2/episodes',
			
			fetchAll,
		});
	},
});
