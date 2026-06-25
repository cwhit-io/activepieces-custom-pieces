import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { planningCenterAuth } from './lib/auth';
import { createPlanTimeAction } from './lib/actions/create-plan-time';
import { getPlanAction } from './lib/actions/get-plan';
import { listNeededPositionsAction } from './lib/actions/list-needed-positions';
import { listPersonBlockoutsAction } from './lib/actions/list-person-blockouts';
import { listPlanPeopleAction } from './lib/actions/list-plan-people';
import { listPlanTeamMembersAction } from './lib/actions/list-plan-team-members';
import { listPlanTimesAction } from './lib/actions/list-plan-times';
import { listPlansAction } from './lib/actions/list-plans';
import { listScheduleExceptionsAction } from './lib/actions/list-schedule-exceptions';
import { listSchedulingRequestsAction } from './lib/actions/list-scheduling-requests';
import { listServiceTypesAction } from './lib/actions/list-service-types';
import { listTeamMembersAction } from './lib/actions/list-team-members';
import { listTeamPositionsAction } from './lib/actions/list-team-positions';
import { listTeamsAction } from './lib/actions/list-teams';
import { planningCenterClient } from './lib/common/client';

const PLANNING_CENTER_SERVICES_LOGO_URL = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#E8622A"/><rect x="14" y="18" width="36" height="30" rx="4" fill="#fff"/><rect x="14" y="18" width="36" height="8" rx="4" fill="#F4B183"/><circle cx="24" cy="22" r="2" fill="#E8622A"/><circle cx="32" cy="22" r="2" fill="#E8622A"/><circle cx="40" cy="22" r="2" fill="#E8622A"/><rect x="20" y="32" width="8" height="8" rx="1.5" fill="#E8622A"/><rect x="32" y="32" width="8" height="8" rx="1.5" fill="#E8622A"/><rect x="20" y="44" width="8" height="4" rx="1" fill="#F4B183"/></svg>',
)}`;

export const planningCenterServices = createPiece({
	displayName: 'Planning Center Services',
	description:
		'Scheduling automation for Planning Center Services — plans, teams, volunteers, and availability.',
	minimumSupportedRelease: '0.36.1',
	logoUrl: PLANNING_CENTER_SERVICES_LOGO_URL,
	categories: [PieceCategory.PRODUCTIVITY],
	auth: planningCenterAuth,
	authors: ['activepieces'],
	actions: [
		listServiceTypesAction,
		listPlansAction,
		getPlanAction,
		listPlanTimesAction,
		createPlanTimeAction,
		listTeamsAction,
		listTeamMembersAction,
		listPlanTeamMembersAction,
		listNeededPositionsAction,
		listPlanPeopleAction,
		listSchedulingRequestsAction,
		listPersonBlockoutsAction,
		listTeamPositionsAction,
		listScheduleExceptionsAction,
		createCustomApiCallAction({
			auth: planningCenterAuth,
			baseUrl: () => planningCenterClient.BASE_URL,
			authMapping: async (auth) => {
				const credentials = planningCenterClient.credentialsFromAuthProps(
					auth.props,
				);
				const encoded = Buffer.from(
					`${credentials.applicationId}:${credentials.secret}`,
				).toString('base64');

				return {
					Authorization: `Basic ${encoded}`,
					'User-Agent':
						'Activepieces Planning Center Services (https://activepieces.com)',
				};
			},
		}),
	],
	triggers: [],
});