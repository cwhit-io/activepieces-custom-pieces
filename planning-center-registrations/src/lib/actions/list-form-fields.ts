import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listFormFieldsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_form_fields',
	displayName: 'List Form Fields',
	description: 'Lists fields on a registration form.',
	audience: 'both',
	aiMetadata: {
		description: 'List fields for a registration form. Use before exporting answers. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		form: planningCenterCommon.formDropdown,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { form, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		return await planningCenterClient.listResources({
			credentials,
			path: `/registrations/v2/forms/${form}/fields`,
			
			fetchAll,
		});
	},
});
