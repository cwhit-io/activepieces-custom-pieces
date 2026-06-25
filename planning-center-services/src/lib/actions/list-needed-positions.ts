import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listNeededPositionsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_needed_positions',
	displayName: 'List Needed Positions',
	description: 'Lists open volunteer slots on a plan.',
	audience: 'both',
	aiMetadata: {
		description:
			'List needed positions (open volunteer slots) on a plan. Primary target for auto-scheduling and shortage monitoring. Read-only and safe to retry.',
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
			path: `/services/v2/service_types/${service_type}/plans/${plan}/needed_positions`,
			fetchAll,
		});
	},
});