import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

export const listChannelSeriesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_channel_series',
	displayName: 'List Channel Series',
	description: 'Lists sermon series scoped to a single channel.',
	audience: 'both',
	aiMetadata: {
		description:
			'List sermon series for one Publishing channel. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		channel: planningCenterCommon.channelDropdown,
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
		const { channel } = context.propsValue;
		const listOptions = planningCenterListOptions({
			props: context.propsValue,
			sortField: 'started_at',
			dateField: 'started_at',
		});

		return await planningCenterClient.listResources({
			credentials,
			path: `/publishing/v2/channels/${channel}/series`,
			...listOptions,
		});
	},
});