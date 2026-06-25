import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { planningCenterAuth } from './lib/auth';
import { listGroupsAction } from './lib/actions/list-groups';
import { listGroupMembershipsAction } from './lib/actions/list-group-memberships';
import { listGroupEventsAction } from './lib/actions/list-group-events';
import { listEventAttendancesAction } from './lib/actions/list-event-attendances';
import { planningCenterClient } from './lib/common/client';

const PLANNING_CENTER_GROUPS_LOGO_URL = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#10B981"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="32" cy="20" r="7" fill="#fff"/></svg>',
)}`;

export const planningCenterGroups = createPiece({
	displayName: 'Planning Center Groups',
	description: 'Small groups, memberships, events, and attendance for Planning Center Groups.',
	minimumSupportedRelease: '0.36.1',
	logoUrl: PLANNING_CENTER_GROUPS_LOGO_URL,
	categories: [PieceCategory.PRODUCTIVITY],
	auth: planningCenterAuth,
	authors: ['activepieces'],
	actions: [
		listGroupsAction,
		listGroupMembershipsAction,
		listGroupEventsAction,
		listEventAttendancesAction,
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
					'User-Agent': 'Activepieces Planning Center Groups (https://activepieces.com)',
				};
			},
		}),
	],
	triggers: [],
});
