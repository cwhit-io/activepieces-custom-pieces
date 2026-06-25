import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { planningCenterAuth } from './lib/auth';
import { listChannelsAction } from './lib/actions/list-channels';
import { getChannelAction } from './lib/actions/get-channel';
import { listSeriesAction } from './lib/actions/list-series';
import { getSeriesAction } from './lib/actions/get-series';
import { listEpisodesAction } from './lib/actions/list-episodes';
import { getEpisodeAction } from './lib/actions/get-episode';
import { listEpisodeTimesAction } from './lib/actions/list-episode-times';
import { listSpeakersAction } from './lib/actions/list-speakers';
import { getSpeakerAction } from './lib/actions/get-speaker';
import { listSpeakershipsAction } from './lib/actions/list-speakerships';
import { getOrganizationAction } from './lib/actions/get-organization';
import { planningCenterClient } from './lib/common/client';

const PLANNING_CENTER_PUBLISHING_LOGO_URL = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#6366F1"/><polygon points="26,18 46,32 26,46" fill="#fff"/><rect x="16" y="18" width="6" height="28" rx="2" fill="#fff"/></svg>',
)}`;

export const planningCenterPublishing = createPiece({
	displayName: 'Planning Center Publishing',
	description: 'Sermon channels, series, episodes, speakers, and organization settings for Publishing.',
	minimumSupportedRelease: '0.36.1',
	logoUrl: PLANNING_CENTER_PUBLISHING_LOGO_URL,
	categories: [PieceCategory.PRODUCTIVITY],
	auth: planningCenterAuth,
	authors: ['activepieces'],
	actions: [
		listChannelsAction,
		getChannelAction,
		listSeriesAction,
		getSeriesAction,
		listEpisodesAction,
		getEpisodeAction,
		listEpisodeTimesAction,
		listSpeakersAction,
		getSpeakerAction,
		listSpeakershipsAction,
		getOrganizationAction,
		createCustomApiCallAction({
			auth: planningCenterAuth,
			baseUrl: () => planningCenterClient.BASE_URL,
			authMapping: async (auth) => {
				const credentials = planningCenterClient.credentialsFromAuthProps(auth.props);
				const encoded = Buffer.from(
					`${credentials.applicationId}:${credentials.secret}`,
				).toString('base64');
				return {
					Authorization: `Basic ${encoded}`,
					'User-Agent': 'Activepieces Planning Center Publishing (https://activepieces.com)',
				};
			},
		}),
	],
	triggers: [],
});
