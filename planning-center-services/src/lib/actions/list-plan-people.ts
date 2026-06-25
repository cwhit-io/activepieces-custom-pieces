import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listPlanPeopleAction = createAction({
	auth: planningCenterAuth,
	name: 'list_plan_people',
	displayName: 'List Plan People',
	description: 'Lists all people involved in a plan.',
	audience: 'both',
	aiMetadata: {
		description:
			'List all people associated with a plan. Use for a full roster view across teams on one service date. Read-only and safe to retry.',
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
			path: `/services/v2/service_types/${service_type}/plans/${plan}/people`,
			fetchAll,
		});
	},
});