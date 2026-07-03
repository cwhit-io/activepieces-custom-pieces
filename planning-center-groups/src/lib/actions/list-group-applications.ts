import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

export const listGroupApplicationsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_group_applications',
	displayName: 'List Group Applications',
	description: 'Lists requests to join groups across the organization.',
	audience: 'both',
	aiMetadata: {
		description:
			'List group join applications (pending, approved, rejected). Use for approval workflows. Read-only and safe to retry.',
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
			sortField: 'applied_at',
			dateField: 'applied_at',
		});

		return await planningCenterClient.listResources({
			credentials,
			path: '/groups/v2/group_applications',
			...listOptions,
		});
	},
});