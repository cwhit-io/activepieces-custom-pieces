import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listEventsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_events',
	displayName: 'List Events',
	description: 'Lists calendar events.',
	audience: 'both',
	aiMetadata: {
		description: 'List Calendar events. Use for facility and schedule visibility. Read-only and safe to retry.',
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
			path: '/calendar/v2/events',
			
			fetchAll,
		});
	},
});
