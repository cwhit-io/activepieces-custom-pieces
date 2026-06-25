import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listEventFormsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_event_forms',
	displayName: 'List Event Forms',
	description: 'Lists forms for an event.',
	audience: 'both',
	aiMetadata: {
		description: 'List forms attached to a registration event. Read-only and safe to retry.',
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
			path: `/registrations/v2/events/${registration_event}/forms`,
			
			fetchAll,
		});
	},
});
