import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { planningCenterAuth } from './lib/auth';
import { listEventsAction } from './lib/actions/list-events';
import { listEventInstancesAction } from './lib/actions/list-event-instances';
import { listResourcesAction } from './lib/actions/list-resources';
import { listReservationsAction } from './lib/actions/list-reservations';
import { listEventResourceBookingsAction } from './lib/actions/list-event-resource-bookings';
import { planningCenterClient } from './lib/common/client';

const PLANNING_CENTER_CALENDAR_LOGO_URL = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#EF4444"/><rect x="14" y="18" width="36" height="30" rx="4" fill="#fff"/><rect x="14" y="18" width="36" height="8" rx="4" fill="#FCA5A5"/><rect x="20" y="32" width="8" height="8" rx="1.5" fill="#EF4444"/><rect x="32" y="32" width="8" height="8" rx="1.5" fill="#EF4444"/></svg>',
)}`;

export const planningCenterCalendar = createPiece({
	displayName: 'Planning Center Calendar',
	description: 'Calendar events, resources, reservations, and room bookings for Planning Center.',
	minimumSupportedRelease: '0.36.1',
	logoUrl: PLANNING_CENTER_CALENDAR_LOGO_URL,
	categories: [PieceCategory.PRODUCTIVITY],
	auth: planningCenterAuth,
	authors: ['activepieces'],
	actions: [
		listEventsAction,
		listEventInstancesAction,
		listResourcesAction,
		listReservationsAction,
		listEventResourceBookingsAction,
		createCustomApiCallAction({
			auth: planningCenterAuth,
			baseUrl: () => planningCenterClient.BASE_URL,
			authMapping: async (auth) => {
				const credentials = planningCenterClient.credentialsFromAuthProps(auth.props);
				const encoded = Buffer.from(
					`${credentials.applicationId}:${credentials.secret}`,
				).toString('base64');
				return {
					Authorization: `Basic ${encoded}`,
					'User-Agent': 'Activepieces Planning Center Calendar (https://activepieces.com)',
				};
			},
		}),
	],
	triggers: [],
});
