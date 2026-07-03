import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { planningCenterAuth } from './lib/auth';
import { listEventsAction } from './lib/actions/list-events';
import { getSignupAction } from './lib/actions/get-signup';
import { listAttendeesAction } from './lib/actions/list-attendees';
import { getAttendeeAction } from './lib/actions/get-attendee';
import { listAllAttendeesAction } from './lib/actions/list-all-attendees';
import { getAttendeePersonAction } from './lib/actions/get-attendee-person';
import { getAttendeeSelectionTypeAction } from './lib/actions/get-attendee-selection-type';
import { listRegistrationsAction } from './lib/actions/list-registrations';
import { getRegistrationAction } from './lib/actions/get-registration';
import { getRegistrantContactAction } from './lib/actions/get-registrant-contact';
import { listEventFormsAction } from './lib/actions/list-event-forms';
import { listSignupTimesAction } from './lib/actions/list-form-fields';
import { listSignupRegistrationsAction } from './lib/actions/list-registration-answers';
import { getNextSignupTimeAction } from './lib/actions/get-next-signup-time';
import { getSignupLocationAction } from './lib/actions/get-signup-location';
import { listCategoriesAction } from './lib/actions/list-categories';
import { createPlanningCenterCustomApiCallAction } from './lib/common/custom-api-call';
import { PLANNING_CENTER_REGISTRATIONS_LOGO_URL } from './lib/logo';

export const planningCenterRegistrations = createPiece({
	displayName: 'Planning Center Registrations',
	description:
		'Signups, attendees, registrations, selection types, and signup times for Planning Center Registrations.',
	minimumSupportedRelease: '0.36.1',
	logoUrl: PLANNING_CENTER_REGISTRATIONS_LOGO_URL,
	categories: [PieceCategory.PRODUCTIVITY],
	auth: planningCenterAuth,
	authors: ['activepieces'],
	actions: [
		listEventsAction,
		getSignupAction,
		listAttendeesAction,
		getAttendeeAction,
		listAllAttendeesAction,
		getAttendeePersonAction,
		getAttendeeSelectionTypeAction,
		listRegistrationsAction,
		getRegistrationAction,
		getRegistrantContactAction,
		listEventFormsAction,
		listSignupTimesAction,
		listSignupRegistrationsAction,
		getNextSignupTimeAction,
		getSignupLocationAction,
		listCategoriesAction,
		createPlanningCenterCustomApiCallAction({
			userAgent:
				'Activepieces Planning Center Registrations (https://activepieces.com)',
		}),
	],
	triggers: [],
});
