import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listEpisodeTimesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_episode_times',
	displayName: 'List Episode Times',
	description: 'Lists scheduled publish times for an episode.',
	audience: 'both',
	aiMetadata: {
		description: 'List episode publish times for sync to external platforms. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		episode: planningCenterCommon.episodeDropdown,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { episode, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		return await planningCenterClient.listResources({
			credentials,
			path: `/publishing/v2/episodes/${episode}/episode_times`,
			
			fetchAll,
		});
	},
});
