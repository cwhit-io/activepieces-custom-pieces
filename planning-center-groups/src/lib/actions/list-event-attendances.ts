import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

export const listEventAttendancesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_event_attendances',
	displayName: 'List Event Attendances',
	description: 'Lists attendance for a group event.',
	audience: 'both',
	aiMetadata: {
		description: 'List attendance records for a group event. Use for follow-up automations. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		group_event: planningCenterCommon.groupEventDropdown,
		sort_direction: planningCenterCommon.sortDirection,
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
			sortField: 'last_name',
			dateField: 'last_name',
		});

		return await planningCenterClient.listResources({
			credentials,
			path: `/groups/v2/events/${context.propsValue.group_event}/attendances`,
			...listOptions,
		});
	},
});
