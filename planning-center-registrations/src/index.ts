import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { planningCenterAuth } from './lib/auth';
import { listEventsAction } from './lib/actions/list-events';
import { listAttendeesAction } from './lib/actions/list-attendees';
import { listRegistrationsAction } from './lib/actions/list-registrations';
import { listEventFormsAction } from './lib/actions/list-event-forms';
import { listFormFieldsAction } from './lib/actions/list-form-fields';
import { listRegistrationAnswersAction } from './lib/actions/list-registration-answers';
import { planningCenterClient } from './lib/common/client';

const PLANNING_CENTER_REGISTRATIONS_LOGO_URL = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#8B5CF6"/><rect x="18" y="16" width="28" height="34" rx="4" fill="#fff"/><rect x="24" y="10" width="16" height="8" rx="3" fill="#fff"/></svg>',
)}`;

export const planningCenterRegistrations = createPiece({
	displayName: 'Planning Center Registrations',
	description: 'Events, attendees, registrations, forms, and answers for Planning Center Registrations.',
	minimumSupportedRelease: '0.36.1',
	logoUrl: PLANNING_CENTER_REGISTRATIONS_LOGO_URL,
	categories: [PieceCategory.PRODUCTIVITY],
	auth: planningCenterAuth,
	authors: ['activepieces'],
	actions: [
		listEventsAction,
		listAttendeesAction,
		listRegistrationsAction,
		listEventFormsAction,
		listFormFieldsAction,
		listRegistrationAnswersAction,
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
					'User-Agent': 'Activepieces Planning Center Registrations (https://activepieces.com)',
				};
			},
		}),
	],
	triggers: [],
});
