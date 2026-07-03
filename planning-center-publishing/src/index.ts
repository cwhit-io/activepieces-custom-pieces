import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { planningCenterAuth } from './lib/auth';
import { listChannelsAction } from './lib/actions/list-channels';
import { getChannelAction } from './lib/actions/get-channel';
import { listSeriesAction } from './lib/actions/list-series';
import { getSeriesAction } from './lib/actions/get-series';
import { listChannelSeriesAction } from './lib/actions/list-channel-series';
import { createSeriesAction } from './lib/actions/create-series';
import { listEpisodesAction } from './lib/actions/list-episodes';
import { createEpisodeAction } from './lib/actions/create-episode';
import { getLatestSundayEpisodeAction } from './lib/actions/get-latest-sunday-episode';
import { getEpisodeAction } from './lib/actions/get-episode';
import { updateEpisodeAction } from './lib/actions/update-episode';
import { getCurrentEpisodeAction } from './lib/actions/get-current-episode';
import { setCurrentEpisodeAction } from './lib/actions/set-current-episode';
import { listEpisodeResourcesAction } from './lib/actions/list-episode-resources';
import { createEpisodeResourceAction } from './lib/actions/create-episode-resource';
import { updateEpisodeResourceAction } from './lib/actions/update-episode-resource';
import { generateDownloadUrlAction } from './lib/actions/generate-download-url';
import { listEpisodeTimesAction } from './lib/actions/list-episode-times';
import { createEpisodeTimeAction } from './lib/actions/create-episode-time';
import { updateEpisodeTimeAction } from './lib/actions/update-episode-time';
import { listSpeakersAction } from './lib/actions/list-speakers';
import { getSpeakerAction } from './lib/actions/get-speaker';
import { listSpeakershipsAction } from './lib/actions/list-speakerships';
import { createSpeakershipAction } from './lib/actions/create-speakership';
import { getNoteTemplateAction } from './lib/actions/get-note-template';
import { updateNoteTemplateAction } from './lib/actions/update-note-template';
import { listChannelStatisticsAction } from './lib/actions/list-channel-statistics';

import { createPlanningCenterCustomApiCallAction } from './lib/common/custom-api-call';
import { PLANNING_CENTER_PUBLISHING_LOGO_URL } from './lib/logo';
import { publishingWebhookTriggers } from './lib/triggers';

export const planningCenterPublishing = createPiece({
	displayName: 'Planning Center Publishing',
	description:
		'Sermon channels, series, episodes, speakers, and webhook triggers for Planning Center Publishing.',
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
		listChannelSeriesAction,
		createSeriesAction,
		listEpisodesAction,
		createEpisodeAction,
		getLatestSundayEpisodeAction,
		getEpisodeAction,
		updateEpisodeAction,
		getCurrentEpisodeAction,
		setCurrentEpisodeAction,
		listEpisodeResourcesAction,
		createEpisodeResourceAction,
		updateEpisodeResourceAction,
		generateDownloadUrlAction,
		listEpisodeTimesAction,
		createEpisodeTimeAction,
		updateEpisodeTimeAction,
		listSpeakersAction,
		getSpeakerAction,
		listSpeakershipsAction,
		createSpeakershipAction,
		getNoteTemplateAction,
		updateNoteTemplateAction,
		listChannelStatisticsAction,
		createPlanningCenterCustomApiCallAction({
			userAgent:
				'Activepieces Planning Center Publishing (https://activepieces.com)',
		}),
	],
	triggers: [...publishingWebhookTriggers],
});