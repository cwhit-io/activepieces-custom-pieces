import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listSchedulingRequestsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_scheduling_requests',
	displayName: 'List Scheduling Requests',
	description:
		'Lists schedules for a person (pending, accepted, and declined assignments).',
	audience: 'both',
	aiMetadata: {
		description:
			'List schedules for a person from the Services API. Use to track pending confirmations, accepted assignments, and declined requests. Read-only and safe to retry.',
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
		const { person, page_size, max_results, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		const queryParams: Record<string, string> = {};
		if (page_size) {
			queryParams['per_page'] = String(page_size);
		}
		const maxResults = max_results ? Number(max_results) : undefined;

		return await planningCenterClient.listResources({
			credentials,
			path: `/services/v2/people/${context.propsValue.person}/schedules`,
			queryParams,
			fetchAll,
			maxResults,
		});
	},
});