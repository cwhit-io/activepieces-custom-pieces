import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listRegistrationAnswersAction = createAction({
	auth: planningCenterAuth,
	name: 'list_registration_answers',
	displayName: 'List Registration Answers',
	description: 'Lists form answers for a registration.',
	audience: 'both',
	aiMetadata: {
		description: 'List custom form answers for a registration. Use for event data export and follow-ups. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		registration: planningCenterCommon.registrationDropdown,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { registration, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		return await planningCenterClient.listResources({
			credentials,
			path: `/registrations/v2/registrations/${registration}/answers`,
			
			fetchAll,
		});
	},
});
