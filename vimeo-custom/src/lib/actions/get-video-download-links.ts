import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest, normalizeVideoId, videoIdNumber } from '../common';

type VimeoDownloadFile = {
	quality?: string;
	rendition?: string;
	type?: string;
	width?: number;
	height?: number;
	size?: number;
	size_short?: string;
	link?: string;
	created_time?: string;
	expires?: string;
};

type VimeoVideoFilesResponse = {
	uri?: string;
	name?: string;
	description?: string;
	link?: string;
	status?: string;
	privacy?: {
		download?: boolean;
		view?: string;
	};
	download?: VimeoDownloadFile[];
	files?: VimeoDownloadFile[];
	play?: {
		status?: string;
		progressive?: VimeoDownloadFile[];
		hls?: {
			link?: string;
			link_expiration_time?: string;
		};
		dash?: {
			link?: string;
			link_expiration_time?: string;
		};
	};
};

export const getVideoDownloadLinks = createAction({
	auth: vimeoAuth,
	name: 'get_video_download_links',
	displayName: 'Get Video Download Links',
	description:
		'Fetches direct download, files, and play links for a video you own.',
	audience: 'both',
	aiMetadata: {
		description:
			'Returns Vimeo download, files, and play link fields for an owned video. Requires video_files OAuth scope and a plan that supports API file access. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		videoId: videoIdNumber,
	},
	async run({ auth, propsValue }) {
		const videoId = normalizeVideoId({ input: propsValue.videoId });

		const response = await apiRequest({
			auth,
			path: `/videos/${videoId}`,
			method: HttpMethod.GET,
			queryParams: {
				fields:
					'uri,name,description,link,status,privacy,download,files,play',
			},
		});

		const body = response.body as VimeoVideoFilesResponse;

		if (!body.download?.length && !body.files?.length && !body.play) {
			const downloadEnabled = body.privacy?.download === true;
			throw new Error(
				downloadEnabled
					? 'No download links returned. Reconnect Vimeo with the video_files scope and confirm your account plan supports API file access.'
					: 'No download links returned. Enable "Allow downloads" on this video in Vimeo privacy settings, reconnect with video_files scope, and retry.',
			);
		}

		return {
			video_id: videoId,
			uri: body.uri,
			name: body.name,
			description: body.description,
			link: body.link,
			status: body.status,
			privacy: body.privacy,
			download: body.download ?? [],
			files: body.files ?? [],
			play: body.play ?? null,
		};
	},
});