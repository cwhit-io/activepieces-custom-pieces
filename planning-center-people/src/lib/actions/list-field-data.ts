import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listFieldDataAction = createAction({
	auth: planningCenterAuth,
	name: 'list_field_data',
	displayName: 'List Field Data',
	description: 'Lists custom field values across people.',
	audience: 'both',
	aiMetadata: {
		description: 'List custom field data (membership, shirt size, background check, etc.). Read-only and safe to retry.',
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
			path: '/people/v2/field_data',
			
			fetchAll,
		});
	},
});
