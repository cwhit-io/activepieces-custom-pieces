import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { sermonshotsAuth } from './lib/auth';
import { getAllRelatedContentAction } from './lib/actions/get-all-related-content';
import { getBlogAction } from './lib/actions/get-blog';
import { getChurchMetaAction } from './lib/actions/get-church-meta';
import { getDevotionalsAction } from './lib/actions/get-devotionals';
import { getDiscussionGuideAction } from './lib/actions/get-discussion-guide';
import { getDownloadableAction } from './lib/actions/get-downloadable';
import { getQuotesAction } from './lib/actions/get-quotes';
import { getSermonClipsAction } from './lib/actions/get-sermon-clips';
import { getSermonImagesAction } from './lib/actions/get-sermon-images';
import { getSummaryAction } from './lib/actions/get-summary';
import { getTitlesAction } from './lib/actions/get-titles';
import { getTranscriptionAction } from './lib/actions/get-transcription';
import { getVideoAction } from './lib/actions/get-video';
import { listVideosAction } from './lib/actions/list-videos';
import { uploadVideoAction } from './lib/actions/upload-video';
import { uploadVideoStreamingAction } from './lib/actions/upload-video-streaming';
import { sermonshotsClient } from './lib/common/client';
import { SERMONSHOTS_LOGO_URL } from './lib/logo';

export const sermonshots = createPiece({
	displayName: 'SermonShots',
	description:
		'Automate sermon video uploads, transcriptions, clips, and AI-generated content with SermonShots.',
	minimumSupportedRelease: '0.36.1',
	logoUrl: SERMONSHOTS_LOGO_URL,
	categories: [PieceCategory.CONTENT_AND_FILES],
	auth: sermonshotsAuth,
	authors: ['activepieces'],
	actions: [
		getChurchMetaAction,
		listVideosAction,
		getVideoAction,
		getAllRelatedContentAction,
		getSummaryAction,
		getBlogAction,
		getDevotionalsAction,
		getQuotesAction,
		getTitlesAction,
		getDiscussionGuideAction,
		getTranscriptionAction,
		getSermonImagesAction,
		getSermonClipsAction,
		getDownloadableAction,
		uploadVideoAction,
		uploadVideoStreamingAction,
		createCustomApiCallAction({
			auth: sermonshotsAuth,
			baseUrl: () => sermonshotsClient.BASE_URL,
			authMapping: async (auth) => ({
				'auth-token': auth.secret_text,
			}),
		}),
	],
	triggers: [],
});