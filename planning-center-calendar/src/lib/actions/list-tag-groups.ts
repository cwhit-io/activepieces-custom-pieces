import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

export const listTagGroupsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_tag_groups',
	displayName: 'List Tag Groups',
	description: 'Lists tag groups that organize calendar tags.',
	audience: 'both',
	aiMetadata: {
		description:
			'List calendar tag groups for filtering automations. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		sort_direction: planningCenterCommon.sortDirection,
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
			sortField: 'name',
			dateField: 'created_at',
		});

		return await planningCenterClient.listResources({
			credentials,
			path: '/calendar/v2/tag_groups',
			...listOptions,
		});
	},
});