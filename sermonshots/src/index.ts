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

const SERMONSHOTS_LOGO_URL = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#5B4FE8"/><rect x="12" y="18" width="40" height="28" rx="4" fill="#fff"/><polygon points="28,26 28,38 40,32" fill="#5B4FE8"/><circle cx="48" cy="20" r="6" fill="#F59E0B"/><rect x="16" y="50" width="32" height="4" rx="2" fill="#fff" opacity="0.9"/></svg>',
)}`;

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