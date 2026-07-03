import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { addVideoToFolder } from './lib/actions/add-video-to-folder';
import { addVideoToShowcase } from './lib/actions/add-video-to-showcase';
import { copyVideo } from './lib/actions/copy-video';
import { createTextTrack } from './lib/actions/create-text-track';
import { createWebhook } from './lib/actions/create-webhook';
import { deleteVideo } from './lib/actions/delete-video';
import { getTranscript } from './lib/actions/get-transcript';
import { getVideo } from './lib/actions/get-video';
import { getVideoDownloadLinks } from './lib/actions/get-video-download-links';
import { getVideoPictures } from './lib/actions/get-video-pictures';
import { getVideoVersions } from './lib/actions/get-video-versions';
import { listMyAlbums } from './lib/actions/list-my-albums';
import { listMyProjects } from './lib/actions/list-my-projects';
import { listTeamProjects } from './lib/actions/list-team-projects';
import { listTextTracks } from './lib/actions/list-text-tracks';
import { listWebhooks } from './lib/actions/list-webhooks';
import { removeVideoFromFolder } from './lib/actions/remove-video-from-folder';
import { removeVideoFromShowcase } from './lib/actions/remove-video-from-showcase';
import { updateVideo } from './lib/actions/update-video';
import { uploadVideo } from './lib/actions/upload-video';
import { vimeoAuth } from './lib/auth';
import { newVideoBySearch } from './lib/triggers/new-video-by-search';
import { newVideoByUser } from './lib/triggers/new-video-by-user';
import { newVideoLiked } from './lib/triggers/new-video-liked';
import { newVideoOfMine } from './lib/triggers/new-video-of-mine';
import { VIMEO_ENHANCED_LOGO_URL } from './lib/logo';

export const vimeo = createPiece({
	displayName: 'Vimeo Enhanced',
	description:
		'Custom Vimeo integration with download links, title/description editing, uploads, folders, showcases, captions, and webhooks.',
	minimumSupportedRelease: '0.36.1',
	logoUrl: VIMEO_ENHANCED_LOGO_URL,
	categories: [PieceCategory.CONTENT_AND_FILES],
	auth: vimeoAuth,
	authors: ['privatestefans', 'sanket-a11y', 'activepieces'],
	actions: [
		uploadVideo,
		updateVideo,
		getVideo,
		getVideoDownloadLinks,
		getVideoPictures,
		getVideoVersions,
		copyVideo,
		deleteVideo,
		listMyAlbums,
		listMyProjects,
		listTeamProjects,
		addVideoToShowcase,
		removeVideoFromShowcase,
		addVideoToFolder,
		removeVideoFromFolder,
		listTextTracks,
		createTextTrack,
		getTranscript,
		listWebhooks,
		createWebhook,
		createCustomApiCallAction({
			auth: vimeoAuth,
			baseUrl: () => 'https://api.vimeo.com',
			authMapping: async (auth) => ({
				Authorization: `Bearer ${auth.access_token}`,
				Accept: 'application/vnd.vimeo.*+json;version=3.4',
			}),
		}),
	],
	triggers: [
		newVideoLiked,
		newVideoBySearch,
		newVideoOfMine,
		newVideoByUser,
	],
});