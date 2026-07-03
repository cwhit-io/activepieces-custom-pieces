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
		page_size: planningCenterCommon.pageSize,
		max_results: planningCenterCommon.maxResults,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { page_size, max_results, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		const queryParams: Record<string, string> = {};
		if (page_size) {
			queryParams['per_page'] = String(page_size);
		}
		const maxResults = max_results ? Number(max_results) : undefined;

		return await planningCenterClient.listResources({
			credentials,
			path: '/registrations/v2/registrations',
			queryParams,
			fetchAll,
			maxResults,
		});
	},
});
