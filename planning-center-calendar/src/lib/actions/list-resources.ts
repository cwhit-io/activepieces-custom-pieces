import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listResourcesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_resources',
	displayName: 'List Resources',
	description: 'Lists rooms and reservable resources.',
	audience: 'both',
	aiMetadata: {
		description: 'List calendar resources (rooms, equipment). Read-only and safe to retry.',
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
			path: '/calendar/v2/resources',
			
			fetchAll,
		});
	},
});
