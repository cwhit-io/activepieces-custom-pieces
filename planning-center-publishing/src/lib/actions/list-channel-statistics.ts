import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listChannelStatisticsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_channel_statistics',
	displayName: 'List Channel Statistics',
	description: 'Lists analytics statistics for a publishing channel.',
	audience: 'both',
	aiMetadata: {
		description:
			'List channel statistics for Publishing analytics automations. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		channel: planningCenterCommon.channelDropdown,
		page_size: planningCenterCommon.pageSize,
		max_results: planningCenterCommon.maxResults,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { channel, page_size, max_results, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		const queryParams: Record<string, string> = {};
		if (page_size) {
			queryParams['per_page'] = String(page_size);
		}
		const maxResults = max_results ? Number(max_results) : undefined;

		return await planningCenterClient.listResources({
			credentials,
			path: `/publishing/v2/channels/${channel}/statistics`,
			queryParams,
			fetchAll,
			maxResults,
		});
	},
});