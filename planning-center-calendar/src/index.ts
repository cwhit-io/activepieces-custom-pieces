import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { planningCenterAuth } from './lib/auth';
import { addTagToEventAction } from './lib/actions/add-tag-to-event';
import { createResourceAction } from './lib/actions/create-resource';
import { createResourceFolderAction } from './lib/actions/create-resource-folder';
import { getEventAction } from './lib/actions/get-event';
import { getEventInstanceAction } from './lib/actions/get-event-instance';
import { getResourceAction } from './lib/actions/get-resource';
import { getResourceRequestAnswersAction } from './lib/actions/get-resource-request-answers';
import { listAllEventInstancesAction } from './lib/actions/list-all-event-instances';
import { listConflictsAction } from './lib/actions/list-conflicts';
import { listEventInstancesAction } from './lib/actions/list-event-instances';
import { listEventResourceBookingsAction } from './lib/actions/list-event-resource-bookings';
import { listEventResourceRequestsAction } from './lib/actions/list-event-resource-requests';
import { listEventsAction } from './lib/actions/list-events';
import { listFeedsAction } from './lib/actions/list-feeds';
import { listReportTemplatesAction } from './lib/actions/list-report-templates';
import { listReservationsAction } from './lib/actions/list-reservations';
import { listResourcesAction } from './lib/actions/list-resources';
import { listTagGroupsAction } from './lib/actions/list-tag-groups';
import { listTagsAction } from './lib/actions/list-tags';
import { createPlanningCenterCustomApiCallAction } from './lib/common/custom-api-call';
import { PLANNING_CENTER_CALENDAR_LOGO_URL } from './lib/logo';
import { calendarWebhookTriggers } from './lib/triggers';

export const planningCenterCalendar = createPiece({
	displayName: 'Planning Center Calendar',
	description:
		'Calendar events, resources, reservations, room bookings, and webhook triggers for Planning Center.',
	minimumSupportedRelease: '0.36.1',
	logoUrl: PLANNING_CENTER_CALENDAR_LOGO_URL,
	categories: [PieceCategory.PRODUCTIVITY],
	auth: planningCenterAuth,
	authors: ['activepieces'],
	actions: [
		listEventsAction,
		getEventAction,
		listEventInstancesAction,
		listAllEventInstancesAction,
		getEventInstanceAction,
		listConflictsAction,
		listEventResourceRequestsAction,
		getResourceRequestAnswersAction,
		listResourcesAction,
		getResourceAction,
		createResourceAction,
		createResourceFolderAction,
		addTagToEventAction,
		listTagsAction,
		listTagGroupsAction,
		listFeedsAction,
		listReportTemplatesAction,
		listReservationsAction,
		listEventResourceBookingsAction,
		createPlanningCenterCustomApiCallAction({
			userAgent:
				'Activepieces Planning Center Calendar (https://activepieces.com)',
		}),
	],
	triggers: [...calendarWebhookTriggers],
});
