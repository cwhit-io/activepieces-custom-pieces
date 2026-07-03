import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

export const listGroupEventsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_group_events',
	displayName: 'List Group Events',
	description: 'Lists events for a group.',
	audience: 'both',
	aiMetadata: {
		description: 'List group events/meetings. Use before pulling attendance. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		group: planningCenterCommon.groupDropdown,
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
			path: `/groups/v2/groups/${context.propsValue.group}/events`,
			...listOptions,
		});
	},
});
