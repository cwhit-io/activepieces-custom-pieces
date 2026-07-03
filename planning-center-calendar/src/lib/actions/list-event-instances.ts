import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

export const listEventInstancesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_event_instances',
	displayName: 'List Event Instances',
	description: 'Lists occurrences of a recurring event.',
	audience: 'both',
	aiMetadata: {
		description: 'List event instances for recurring calendar events. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		calendar_event: planningCenterCommon.calendarEventDropdown,
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
			sortField: 'starts_at',
			dateField: 'starts_at',
		});

		return await planningCenterClient.listResources({
			credentials,
			path: `/calendar/v2/events/${context.propsValue.calendar_event}/event_instances`,
			...listOptions,
		});
	},
});
