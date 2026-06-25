import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listScheduleExceptionsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_schedule_exceptions',
	displayName: 'List Schedule Exceptions',
	description: 'Lists scheduling blockouts for a team.',
	audience: 'both',
	aiMetadata: {
		description:
			'List schedule exceptions (blockouts) for a team. Use to respect team-level scheduling restrictions when assigning volunteers. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		service_type: planningCenterCommon.serviceTypeDropdown,
		team: planningCenterCommon.teamDropdown,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { team, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		return await planningCenterClient.listResources({
			credentials,
			path: `/services/v2/teams/${team}/schedule_exceptions`,
			fetchAll,
		});
	},
});