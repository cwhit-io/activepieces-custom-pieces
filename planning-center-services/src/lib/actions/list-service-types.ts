import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

export const listServiceTypesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_service_types',
	displayName: 'List Service Types',
	description: 'Lists all service types (e.g. Sunday Morning, Youth Service).',
	audience: 'both',
	aiMetadata: {
		description:
			'List Planning Center Services service types. Use as the first step to discover service_type_id values before listing plans or teams. Read-only and safe to retry.',
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
			path: '/services/v2/service_types',
			...listOptions,
		});
	},
});