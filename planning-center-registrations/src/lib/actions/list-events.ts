import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listEventsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_events',
	displayName: 'List Events',
	description: 'Lists registration events.',
	audience: 'both',
	aiMetadata: {
		description: 'List Registrations events. Use to find event_id before attendees or forms. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const fetchAll = context.propsValue.fetch_all_pages ?? true;

		return await planningCenterClient.listResources({
			credentials,
			path: '/registrations/v2/events',
			
			fetchAll,
		});
	},
});
