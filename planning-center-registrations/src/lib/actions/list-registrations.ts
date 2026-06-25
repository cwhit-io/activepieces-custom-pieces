import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listRegistrationsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_registrations',
	displayName: 'List Registrations',
	description: 'Lists registration records.',
	audience: 'both',
	aiMetadata: {
		description: 'List registration records with payment and add-on details. Read-only and safe to retry.',
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
			path: '/registrations/v2/registrations',
			
			fetchAll,
		});
	},
});
