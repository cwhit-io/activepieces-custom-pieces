import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listPersonAddressesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_person_addresses',
	displayName: 'List Person Addresses',
	description: 'Lists addresses for a person.',
	audience: 'both',
	aiMetadata: {
		description: 'List addresses for a person. Use for mailing lists or geographic reporting. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		person: planningCenterCommon.personDropdown,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { person, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		return await planningCenterClient.listResources({
			credentials,
			path: `/people/v2/people/${person}/addresses`,
			
			fetchAll,
		});
	},
});
