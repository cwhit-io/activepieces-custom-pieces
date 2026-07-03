import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { acceptScheduleAction } from './lib/actions/accept-schedule';
import { addTeamMemberToPlanAction } from './lib/actions/add-team-member-to-plan';
import { autoschedulePlanAction } from './lib/actions/autoschedule-plan';
import { createItemAssignmentAction } from './lib/actions/create-item-assignment';
import { createNeededPositionAction } from './lib/actions/create-needed-position';
import { createPersonBlockoutAction } from './lib/actions/create-person-blockout';
import { createPlanTimeAction } from './lib/actions/create-plan-time';
import { createPlansAction } from './lib/actions/create-plans';
import { declineScheduleAction } from './lib/actions/decline-schedule';
import { getPersonAction } from './lib/actions/get-person';
import { getPlanAction } from './lib/actions/get-plan';
import { getPlanTeamSchedulingAction } from './lib/actions/get-plan-team-scheduling';
import { listArrangementsAction } from './lib/actions/list-arrangements';
import { listAvailableSignupsAction } from './lib/actions/list-available-signups';
import { listItemAssignmentsAction } from './lib/actions/list-item-assignments';
import { listNeededPositionsAction } from './lib/actions/list-needed-positions';
import { listPersonBlockoutsAction } from './lib/actions/list-person-blockouts';
import { listPersonPlanPeopleAction } from './lib/actions/list-person-plan-people';
import { listPersonTeamPositionAssignmentsAction } from './lib/actions/list-person-team-position-assignments';
import { listPlanItemsAction } from './lib/actions/list-plan-items';
import { listPlanPeopleAction } from './lib/actions/list-plan-people';
import { listPlanTeamMembersAction } from './lib/actions/list-plan-team-members';
import { listPlanTimesAction } from './lib/actions/list-plan-times';
import { listPlansAction } from './lib/actions/list-plans';
import { listSchedulingPreferencesAction } from './lib/actions/list-schedule-exceptions';
import { listSchedulingRequestsAction } from './lib/actions/list-scheduling-requests';
import { listServiceTypesAction } from './lib/actions/list-service-types';
import { listSignupTeamsAction } from './lib/actions/list-signup-teams';
import { listSongsAction } from './lib/actions/list-songs';
import { listTeamMembersAction } from './lib/actions/list-team-members';
import { listTeamPositionsAction } from './lib/actions/list-team-positions';
import { listTeamsAction } from './lib/actions/list-teams';
import { removePlanTeamMemberAction } from './lib/actions/remove-plan-team-member';
import { updateNeededPositionAction } from './lib/actions/update-needed-position';
import { updatePlanPersonAction } from './lib/actions/update-plan-person';
import { updatePlanTeamMemberAction } from './lib/actions/update-plan-team-member';
import { planningCenterAuth } from './lib/auth';
import { createPlanningCenterCustomApiCallAction } from './lib/common/custom-api-call';
import { PLANNING_CENTER_SERVICES_LOGO_URL } from './lib/logo';
import { servicesWebhookTriggers } from './lib/triggers';

export const planningCenterServices = createPiece({
	displayName: 'Planning Center Services',
	description:
		'Scheduling automation for Planning Center Services — plans, teams, volunteers, availability, and webhooks.',
	minimumSupportedRelease: '0.36.1',
	logoUrl: PLANNING_CENTER_SERVICES_LOGO_URL,
	categories: [PieceCategory.PRODUCTIVITY],
	auth: planningCenterAuth,
	authors: ['activepieces'],
	actions: [
		listServiceTypesAction,
		listPlansAction,
		getPlanAction,
		getPlanTeamSchedulingAction,
		listPlanTimesAction,
		createPlanTimeAction,
		createPlansAction,
		autoschedulePlanAction,
		listTeamsAction,
		listTeamMembersAction,
		listPlanTeamMembersAction,
		addTeamMemberToPlanAction,
		updatePlanTeamMemberAction,
		removePlanTeamMemberAction,
		listNeededPositionsAction,
		createNeededPositionAction,
		updateNeededPositionAction,
		listPlanPeopleAction,
		listPersonPlanPeopleAction,
		updatePlanPersonAction,
		listSchedulingRequestsAction,
		acceptScheduleAction,
		declineScheduleAction,
		getPersonAction,
		listPersonTeamPositionAssignmentsAction,
		listPersonBlockoutsAction,
		createPersonBlockoutAction,
		listAvailableSignupsAction,
		listTeamPositionsAction,
		listSchedulingPreferencesAction,
		listPlanItemsAction,
		listItemAssignmentsAction,
		createItemAssignmentAction,
		listSignupTeamsAction,
		listSongsAction,
		listArrangementsAction,
		createPlanningCenterCustomApiCallAction({
			userAgent:
				'Activepieces Planning Center Services (https://activepieces.com)',
		}),
	],
	triggers: [...servicesWebhookTriggers],
});