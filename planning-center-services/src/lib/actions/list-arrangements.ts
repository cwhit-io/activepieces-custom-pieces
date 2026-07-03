import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listArrangementsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_arrangements',
	displayName: 'List Arrangements',
	description: 'Lists arrangements (versions) for a song.',
	audience: 'both',
	aiMetadata: {
		description:
			'List arrangements for a song via GET /songs/{id}/arrangements. Use for music planning integrations to find chord charts and keys. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		song: planningCenterCommon.songDropdown,
		page_size: planningCenterCommon.pageSize,
		max_results: planningCenterCommon.maxResults,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { song, page_size, max_results, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		const queryParams: Record<string, string> = {};
		if (page_size) {
			queryParams['per_page'] = String(page_size);
		}
		const maxResults = max_results ? Number(max_results) : undefined;

		return await planningCenterClient.listResources({
			credentials,
			path: `/services/v2/songs/${song}/arrangements`,
			queryParams,
			fetchAll,
			maxResults,
		});
	},
});