import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listEpisodeResourcesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_episode_resources',
	displayName: 'List Episode Resources',
	description:
		'Lists notes, links, and downloads attached to an episode.',
	audience: 'both',
	aiMetadata: {
		description:
			'List episode resources (notes, links, downloads) for a sermon episode. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		episode: planningCenterCommon.episodeDropdown,
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

		const queryParams: Record<string, string> = {};
		if (page_size) {
			queryParams['per_page'] = String(page_size);
		}
		const maxResults = max_results ? Number(max_results) : undefined;

		return await planningCenterClient.listResources({
			credentials,
			path: `/publishing/v2/episodes/${context.propsValue.episode}/episode_resources`,
			queryParams,
			fetchAll,
			maxResults,
		});
	},
});