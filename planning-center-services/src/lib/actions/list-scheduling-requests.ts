import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listSchedulingRequestsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_scheduling_requests',
	displayName: 'List Scheduling Requests',
	description:
		'Lists scheduling requests for a person (accept/decline status).',
	audience: 'both',
	aiMetadata: {
		description:
			'List scheduling requests for a person. Use to track pending confirmations, accepted assignments, and declined requests. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		person_search: planningCenterCommon.personSearch,
		person: planningCenterCommon.personDropdown,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { person, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		return await planningCenterClient.listResources({
			credentials,
			path: `/services/v2/people/${person}/scheduling_requests`,
			fetchAll,
		});
	},
});