import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listSchedulingPreferencesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_scheduling_preferences',
	displayName: 'List Scheduling Preferences',
	description:
		'Lists scheduling preferences for a person (replaces the removed team schedule_exceptions endpoint).',
	audience: 'both',
	aiMetadata: {
		description:
			'List scheduling preferences for a person in Services. Use to understand how a volunteer prefers to be scheduled. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		person_search: planningCenterCommon.personSearch,
		person: planningCenterCommon.personDropdown,
		page_size: planningCenterCommon.pageSize,
		max_results: planningCenterCommon.maxResults,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { page_size, max_results, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		const queryParams: Record<string, string> = {};
		if (page_size) {
			queryParams['per_page'] = String(page_size);
		}
		const maxResults = max_results ? Number(max_results) : undefined;

		return await planningCenterClient.listResources({
			credentials,
			path: `/services/v2/people/${context.propsValue.person}/scheduling_preferences`,
			queryParams,
			fetchAll,
			maxResults,
		});
	},
});