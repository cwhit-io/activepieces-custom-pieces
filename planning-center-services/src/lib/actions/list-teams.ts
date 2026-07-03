import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

export const listTeamsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_teams',
	displayName: 'List Teams',
	description: 'Lists teams for a service type (e.g. Band, Tech, Greeters).',
	audience: 'both',
	aiMetadata: {
		description:
			'List teams under a service type. Use to discover team_id values and rosters for scheduling. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		service_type: planningCenterCommon.serviceTypeDropdown,
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
			path: `/services/v2/service_types/${context.propsValue.service_type}/teams`,
			...listOptions,
		});
	},
});