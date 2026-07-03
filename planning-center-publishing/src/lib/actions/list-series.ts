import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

export const listSeriesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_series',
	displayName: 'List Series',
	description: 'Lists sermon series.',
	audience: 'both',
	aiMetadata: {
		description: 'List sermon series with artwork and descriptions. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		sort_direction: planningCenterCommon.sortDirection,
		date_filter: planningCenterCommon.dateFilter,
		timezone: planningCenterCommon.timeZone,
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
			sortField: 'started_at',
			dateField: 'started_at',
		});

		return await planningCenterClient.listResources({
			credentials,
			path: '/publishing/v2/series',
			...listOptions,
		});
	},
});
