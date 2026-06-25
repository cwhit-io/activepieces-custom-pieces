import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listAttendeesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_attendees',
	displayName: 'List Attendees',
	description: 'Lists attendees for an event.',
	audience: 'both',
	aiMetadata: {
		description: 'List event attendees including payment status. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		registration_event: planningCenterCommon.registrationEventDropdown,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { registration_event, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		return await planningCenterClient.listResources({
			credentials,
			path: `/registrations/v2/events/${registration_event}/attendees`,
			
			fetchAll,
		});
	},
});
