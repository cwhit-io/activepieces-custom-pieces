import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { planningCenterAuth } from './lib/auth';
import { listGroupsAction } from './lib/actions/list-groups';
import { getGroupAction } from './lib/actions/get-group';
import { listGroupMembershipsAction } from './lib/actions/list-group-memberships';
import { addGroupMembershipAction } from './lib/actions/add-group-membership';
import { updateMembershipAction } from './lib/actions/update-membership';
import { removeMembershipAction } from './lib/actions/remove-membership';
import { listGroupEventsAction } from './lib/actions/list-group-events';
import { listAllEventsAction } from './lib/actions/list-all-events';
import { getGroupEventAction } from './lib/actions/get-group-event';
import { listRsvpsAction } from './lib/actions/list-rsvps';
import { listEventAttendancesAction } from './lib/actions/list-event-attendances';
import { listEventNotesAction } from './lib/actions/list-event-notes';
import { listGroupApplicationsAction } from './lib/actions/list-group-applications';
import { getGroupApplicationAction } from './lib/actions/get-group-application';
import { listGroupTypesAction } from './lib/actions/list-group-types';
import { createPlanningCenterCustomApiCallAction } from './lib/common/custom-api-call';
import { PLANNING_CENTER_GROUPS_LOGO_URL } from './lib/logo';
import { groupsWebhookTriggers } from './lib/triggers';

export const planningCenterGroups = createPiece({
	displayName: 'Planning Center Groups',
	description:
		'Small groups, memberships, events, attendance, and webhook triggers for Planning Center Groups.',
	minimumSupportedRelease: '0.36.1',
	logoUrl: PLANNING_CENTER_GROUPS_LOGO_URL,
	categories: [PieceCategory.PRODUCTIVITY],
	auth: planningCenterAuth,
	authors: ['activepieces'],
	actions: [
		listGroupsAction,
		getGroupAction,
		listGroupMembershipsAction,
		addGroupMembershipAction,
		updateMembershipAction,
		removeMembershipAction,
		listGroupEventsAction,
		listAllEventsAction,
		getGroupEventAction,
		listRsvpsAction,
		listEventAttendancesAction,
		listEventNotesAction,
		listGroupApplicationsAction,
		getGroupApplicationAction,
		listGroupTypesAction,
		createPlanningCenterCustomApiCallAction({
			userAgent:
				'Activepieces Planning Center Groups (https://activepieces.com)',
		}),
	],
	triggers: [...groupsWebhookTriggers],
});
