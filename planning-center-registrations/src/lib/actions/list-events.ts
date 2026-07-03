import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

export const listEventsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_events',
	displayName: 'List Signups',
	description: 'Lists registration signups (the Registrations API event container).',
	audience: 'both',
	aiMetadata: {
		description: 'List Registrations signups. Use to find signup_id before attendees or selection types. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		sort_direction: planningCenterCommon.sortDirection,
		start_date: planningCenterCommon.startDate,
		end_date: planningCenterCommon.endDate,
		page_size: planningCenterCommon.pageSize,
		max_results: planningCenterCommon.maxResults,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const listOptions = planningCenterListOptions({
			props: context.propsValue,
			sortField: 'created_at',
			dateField: 'created_at',
		});

		return await planningCenterClient.listResources({
			credentials,
			path: '/registrations/v2/signups',
			...listOptions,
		});
	},
});
