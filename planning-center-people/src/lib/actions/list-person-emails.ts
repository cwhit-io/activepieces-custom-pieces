import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listPersonEmailsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_person_emails',
	displayName: 'List Person Emails',
	description: 'Lists email addresses for a person.',
	audience: 'both',
	aiMetadata: {
		description: 'List emails for a person. Use when syncing contact info or validating communication channels. Read-only and safe to retry.',
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
			path: `/people/v2/people/${person}/emails`,
			
			fetchAll,
		});
	},
});
