import { createAction } from '@activepieces/pieces-framework';
import { sermonshotsAuth } from '../auth';
import { sermonshotsClient } from '../common/client';
import { sermonshotsCommon } from '../common/props';

export const listVideosAction = createAction({
	auth: sermonshotsAuth,
	name: 'list_videos',
	displayName: 'List Videos',
	description: 'Lists sermon videos in your SermonShots account.',
	audience: 'both',
	aiMetadata: {
		description:
			'List videos with optional pagination and sort order. Use to discover video IDs or monitor uploads. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		page: sermonshotsCommon.page,
		limit: sermonshotsCommon.limit,
		sort: sermonshotsCommon.sortOrder,
		fetch_all_pages: sermonshotsCommon.fetchAllPages,
	},
	async run(context) {
		const authToken = sermonshotsClient.tokenFromAuth(context.auth);
		const { page, limit, sort, fetch_all_pages } = context.propsValue;

		const result = await sermonshotsClient.listVideos({
			authToken,
			page: page ?? 1,
			limit: limit ?? 10,
			sort: sort ?? 'DESC',
			fetchAll: fetch_all_pages ?? true,
		});

		return result.videos;
	},
});