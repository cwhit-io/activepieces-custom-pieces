import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

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
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { service_type, plan, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		return await planningCenterClient.listResources({
			credentials,
			path: `/services/v2/service_types/${service_type}/plans/${plan}/plan_times`,
			fetchAll,
		});
	},
});