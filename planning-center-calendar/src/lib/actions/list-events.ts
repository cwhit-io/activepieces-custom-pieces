import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

export const listEventsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_events',
	displayName: 'List Events',
	description: 'Lists calendar events.',
	audience: 'both',
	aiMetadata: {
		description: 'List Calendar events. Use for facility and schedule visibility. Read-only and safe to retry.',
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
			path: '/calendar/v2/events',
			...listOptions,
		});
	},
});
