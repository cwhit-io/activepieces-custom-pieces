import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import {
	apiRequest,
	normalizeVideoId,
	userFolderDropdown,
	videoIdNumber,
} from '../common';

export const removeVideoFromFolder = createAction({
	auth: vimeoAuth,
	name: 'remove_video_from_folder',
	displayName: 'Remove Video from Folder',
	description: 'Removes a video from a folder without deleting the video.',
	audience: 'both',
	aiMetadata: {
		description:
			'Removes a video from a Vimeo folder (project) by ID. Does not delete the video itself. Idempotent when the video is already absent from the folder.',
		idempotent: true,
	},
	props: {
		videoId: videoIdNumber,
		folderId: userFolderDropdown,
	},
	async run({ auth, propsValue }) {
		const videoId = normalizeVideoId({ input: propsValue.videoId });
		const { folderId } = propsValue;

		if (!folderId) {
			throw new Error(
				'Folder selection is required. Please select a folder.',
			);
		}

		const response = await apiRequest({
			auth,
			path: `/me/projects/${folderId}/videos/${videoId}`,
			method: HttpMethod.DELETE,
		});

		if (response.status === 204) {
			return {
				success: true,
				message: `Video '${videoId}' removed from folder '${folderId}' successfully`,
			};
		}

		return {
			success: false,
			status: response.status,
			body: response.body,
		};
	},
});