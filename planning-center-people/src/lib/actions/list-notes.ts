import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

export const listNotesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_notes',
	displayName: 'List Notes',
	description: 'Lists pastoral care and interaction notes.',
	audience: 'both',
	aiMetadata: {
		description:
			'List notes across people. Use for pastoral care logging and interaction history. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		sort_direction: planningCenterCommon.sortDirection,
		start_date: planningCenterCommon.startDate,
		end_date: planningCenterCommon.endDate,
		page_size: planningCenterCommon.pageSize,
		max_results: planningCenterCommon.maxResults,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const listOptions = planningCenterListOptions({
			props: context.propsValue,
			sortField: 'created_at',
			dateField: 'created_at',
		});

		return await planningCenterClient.listResources({
			credentials,
			path: '/people/v2/notes',
			...listOptions,
		});
	},
});