import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listPersonPhoneNumbersAction = createAction({
	auth: planningCenterAuth,
	name: 'list_person_phone_numbers',
	displayName: 'List Person Phone Numbers',
	description: 'Lists phone numbers for a person.',
	audience: 'both',
	aiMetadata: {
		description: 'List phone numbers for a person. Use for directory sync or SMS workflows. Read-only and safe to retry.',
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
			path: `/people/v2/people/${person}/phone_numbers`,
			
			fetchAll,
		});
	},
});
