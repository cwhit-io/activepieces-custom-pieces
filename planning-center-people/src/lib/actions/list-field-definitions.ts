import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

export const listFieldDefinitionsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_field_definitions',
	displayName: 'List Field Definitions',
	description: 'Lists custom field definitions (tabs, slugs, data types).',
	audience: 'both',
	aiMetadata: {
		description:
			'List custom field definitions. Use to build dynamic field pickers or discover available profile fields. Read-only and safe to retry.',
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
			path: '/people/v2/field_definitions',
			...listOptions,
		});
	},
});