import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listSongsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_songs',
	displayName: 'List Songs',
	description: 'Lists songs from the Planning Center Services song library.',
	audience: 'both',
	aiMetadata: {
		description:
			'List songs from the Services song library. Use for music planning integrations and arrangement lookups. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
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

		const queryParams: Record<string, string> = {
			order: 'title',
		};
		if (page_size) {
			queryParams['per_page'] = String(page_size);
		}
		const maxResults = max_results ? Number(max_results) : undefined;

		return await planningCenterClient.listResources({
			credentials,
			path: '/services/v2/songs',
			queryParams,
			fetchAll,
			maxResults,
		});
	},
});