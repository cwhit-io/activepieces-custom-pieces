import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

export const listPeopleAction = createAction({
	auth: planningCenterAuth,
	name: 'list_people',
	displayName: 'List People',
	description: 'Lists people with optional name search.',
	audience: 'both',
	aiMetadata: {
		description: 'List Planning Center people. Use to search directories or sync profiles. Supports optional name search. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		person_search: planningCenterCommon.personSearch,
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
			sortField: 'last_name',
			dateField: 'created_at',
		});
		const { person_search } = context.propsValue;
		if (typeof person_search === 'string' && person_search.length > 0) {
			listOptions.queryParams['where[search_name]'] = person_search;
		}

		return await planningCenterClient.listResources({
			credentials,
			path: '/people/v2/people',
			...listOptions,
		});
	},
});
