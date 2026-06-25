import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

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
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const fetchAll = context.propsValue.fetch_all_pages ?? true;
		const queryParams: Record<string, string> = {};
		const { person_search } = context.propsValue;
		if (typeof person_search === 'string' && person_search.length > 0) {
			queryParams['where[search_name]'] = person_search;
		}

		return await planningCenterClient.listResources({
			credentials,
			path: '/people/v2/people',
			queryParams,
			fetchAll,
		});
	},
});
