import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

export const listPlanTimesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_plan_times',
	displayName: 'List Plan Times',
	description: 'Lists service times for a plan (e.g. 9:00 AM, 11:00 AM).',
	audience: 'both',
	aiMetadata: {
		description:
			'List plan times (service times) for a plan. Use to retrieve rehearsal times, call times, and service start times. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		service_type: planningCenterCommon.serviceTypeDropdown,
		plan: planningCenterCommon.planDropdown,
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
			sortField: 'starts_at',
			dateField: 'starts_at',
		});

		return await planningCenterClient.listResources({
			credentials,
			path: `/services/v2/service_types/${context.propsValue.service_type}/plans/${context.propsValue.plan}/plan_times`,
			...listOptions,
		});
	},
});