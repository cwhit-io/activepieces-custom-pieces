import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listReservationsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_reservations',
	displayName: 'List Reservations',
	description: 'Lists room and resource reservations.',
	audience: 'both',
	aiMetadata: {
		description: 'List reservations for conflict detection and approvals. Read-only and safe to retry.',
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
			path: '/calendar/v2/reservations',
			
			fetchAll,
		});
	},
});
