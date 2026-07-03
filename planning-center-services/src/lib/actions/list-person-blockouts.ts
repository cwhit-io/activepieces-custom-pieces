import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

export const listPersonBlockoutsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_person_blockouts',
	displayName: 'List Person Blockouts',
	description:
		'Lists dates when a person cannot be scheduled (Services API blockouts).',
	audience: 'both',
	aiMetadata: {
		description:
			'List blockouts for a person from the Services API. Use before auto-scheduling to avoid conflicts when a volunteer is unavailable. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		person_search: planningCenterCommon.personSearch,
		person: planningCenterCommon.personDropdown,
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
			sortField: 'starts_at',
			dateField: 'starts_at',
		});

		return await planningCenterClient.listResources({
			credentials,
			path: `/services/v2/people/${context.propsValue.person}/blockouts`,
			...listOptions,
		});
	},
});