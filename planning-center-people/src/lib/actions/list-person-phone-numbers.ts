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
		page_size: planningCenterCommon.pageSize,
		max_results: planningCenterCommon.maxResults,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { person, page_size, max_results, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		const queryParams: Record<string, string> = {};
		if (page_size) {
			queryParams['per_page'] = String(page_size);
		}
		const maxResults = max_results ? Number(max_results) : undefined;

		return await planningCenterClient.listResources({
			credentials,
			path: `/people/v2/people/${context.propsValue.person}/phone_numbers`,
			queryParams,
			fetchAll,
			maxResults,
		});
	},
});
