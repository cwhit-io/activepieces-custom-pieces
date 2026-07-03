import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

export const listGroupTypesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_group_types',
	displayName: 'List Group Types',
	description: 'Lists group types (categories) in the organization.',
	audience: 'both',
	aiMetadata: {
		description:
			'List group types for filtering automations by category. Read-only and safe to retry.',
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
			dateField: 'name',
		});

		return await planningCenterClient.listResources({
			credentials,
			path: '/groups/v2/group_types',
			...listOptions,
		});
	},
});