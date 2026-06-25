import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listChannelsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_channels',
	displayName: 'List Channels',
	description: 'Lists publishing channels.',
	audience: 'both',
	aiMetadata: {
		description: 'List Publishing channels (sermon feeds). Read-only and safe to retry.',
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
			path: '/publishing/v2/channels',
			
			fetchAll,
		});
	},
});
