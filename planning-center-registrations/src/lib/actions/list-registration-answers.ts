import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listSignupRegistrationsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_signup_registrations',
	displayName: 'List Signup Registrations',
	description:
		'Lists registration records submitted for a signup (replaces removed registration answers endpoint).',
	audience: 'both',
	aiMetadata: {
		description:
			'List registrations for a signup. Use for event data export and follow-ups. Read-only and safe to retry.',
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
			path: `/registrations/v2/signups/${context.propsValue.registration_event}/registrations`,
			queryParams,
			fetchAll,
			maxResults,
		});
	},
});