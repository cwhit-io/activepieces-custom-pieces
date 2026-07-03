import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listSignupTimesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_signup_times',
	displayName: 'List Signup Times',
	description: 'Lists available time slots for a signup.',
	audience: 'both',
	aiMetadata: {
		description:
			'List signup times for a registration signup. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		registration_event: planningCenterCommon.registrationEventDropdown,
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
			path: `/registrations/v2/signups/${context.propsValue.registration_event}/signup_times`,
			queryParams,
			fetchAll,
			maxResults,
		});
	},
});