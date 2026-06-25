import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listEventInstancesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_event_instances',
	displayName: 'List Event Instances',
	description: 'Lists occurrences of a recurring event.',
	audience: 'both',
	aiMetadata: {
		description: 'List event instances for recurring calendar events. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		calendar_event: planningCenterCommon.calendarEventDropdown,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { calendar_event, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		return await planningCenterClient.listResources({
			credentials,
			path: `/calendar/v2/events/${calendar_event}/event_instances`,
			
			fetchAll,
		});
	},
});
