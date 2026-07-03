import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listGroupMembershipsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_group_memberships',
	displayName: 'List Group Memberships',
	description: 'Lists members and roles for a group.',
	audience: 'both',
	aiMetadata: {
		description: 'List group memberships including leader/member roles. Use for roster sync. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		group: planningCenterCommon.groupDropdown,
		page_size: planningCenterCommon.pageSize,
		max_results: planningCenterCommon.maxResults,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { group, page_size, max_results, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		const queryParams: Record<string, string> = {};
		if (page_size) {
			queryParams['per_page'] = String(page_size);
		}
		const maxResults = max_results ? Number(max_results) : undefined;

		return await planningCenterClient.listResources({
			credentials,
			path: `/groups/v2/groups/${context.propsValue.group}/memberships`,
			queryParams,
			fetchAll,
			maxResults,
		});
	},
});
