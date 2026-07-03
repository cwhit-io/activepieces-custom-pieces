import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

export const listAllEventInstancesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_all_event_instances',
	displayName: 'List All Event Instances',
	description: 'Lists event occurrences across the organization.',
	audience: 'both',
	aiMetadata: {
		description:
			'List all calendar event instances org-wide (not scoped to one event). Read-only and safe to retry.',
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
			sortField: 'starts_at',
			dateField: 'starts_at',
		});

		return await planningCenterClient.listResources({
			credentials,
			path: '/calendar/v2/event_instances',
			...listOptions,
		});
	},
});