import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listEventAttendancesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_event_attendances',
	displayName: 'List Event Attendances',
	description: 'Lists attendance for a group event.',
	audience: 'both',
	aiMetadata: {
		description: 'List attendance records for a group event. Use for follow-up automations. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		group_event: planningCenterCommon.groupEventDropdown,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { group_event, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		return await planningCenterClient.listResources({
			credentials,
			path: `/groups/v2/events/${group_event}/attendances`,
			
			fetchAll,
		});
	},
});
