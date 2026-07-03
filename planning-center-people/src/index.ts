import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { planningCenterAuth } from './lib/auth';
import { listPeopleAction } from './lib/actions/list-people';
import { getPersonAction } from './lib/actions/get-person';
import { createPersonAction } from './lib/actions/create-person';
import { updatePersonAction } from './lib/actions/update-person';
import { listPersonEmailsAction } from './lib/actions/list-person-emails';
import { createPersonEmailAction } from './lib/actions/create-person-email';
import { listPersonPhoneNumbersAction } from './lib/actions/list-person-phone-numbers';
import { createPersonPhoneNumberAction } from './lib/actions/create-person-phone-number';
import { listPersonAddressesAction } from './lib/actions/list-person-addresses';
import { createPersonAddressAction } from './lib/actions/create-person-address';
import { listFieldDataAction } from './lib/actions/list-field-data';
import { updateFieldDataAction } from './lib/actions/update-field-data';
import { listFieldDefinitionsAction } from './lib/actions/list-field-definitions';
import { listListsAction } from './lib/actions/list-lists';
import { getListAction } from './lib/actions/get-list';
import { listListPeopleAction } from './lib/actions/list-list-people';
import { addPersonToListAction } from './lib/actions/add-person-to-list';
import { removePersonFromListAction } from './lib/actions/remove-person-from-list';
import { listFormsAction } from './lib/actions/list-forms';
import { listFormSubmissionsAction } from './lib/actions/list-form-submissions';
import { listHouseholdsAction } from './lib/actions/list-households';
import { createHouseholdMembershipAction } from './lib/actions/create-household-membership';
import { listNotesAction } from './lib/actions/list-notes';
import { createNoteAction } from './lib/actions/create-note';
import { listWorkflowsAction } from './lib/actions/list-workflows';
import { createPlanningCenterCustomApiCallAction } from './lib/common/custom-api-call';
import { PLANNING_CENTER_PEOPLE_LOGO_URL } from './lib/logo';
import { peopleWebhookTriggers } from './lib/triggers';

export const planningCenterPeople = createPiece({
	displayName: 'Planning Center People',
	description:
		'People profiles, contact info, custom fields, lists, and webhook triggers for Planning Center.',
	minimumSupportedRelease: '0.36.1',
	logoUrl: PLANNING_CENTER_PEOPLE_LOGO_URL,
	categories: [PieceCategory.PRODUCTIVITY],
	auth: planningCenterAuth,
	authors: ['activepieces'],
	actions: [
		listPeopleAction,
		getPersonAction,
		createPersonAction,
		updatePersonAction,
		listPersonEmailsAction,
		createPersonEmailAction,
		listPersonPhoneNumbersAction,
		createPersonPhoneNumberAction,
		listPersonAddressesAction,
		createPersonAddressAction,
		listFieldDataAction,
		updateFieldDataAction,
		listFieldDefinitionsAction,
		listListsAction,
		getListAction,
		listListPeopleAction,
		addPersonToListAction,
		removePersonFromListAction,
		listFormsAction,
		listFormSubmissionsAction,
		listHouseholdsAction,
		createHouseholdMembershipAction,
		listNotesAction,
		createNoteAction,
		listWorkflowsAction,
		createPlanningCenterCustomApiCallAction({
			userAgent:
				'Activepieces Planning Center People (https://activepieces.com)',
		}),
	],
	triggers: [...peopleWebhookTriggers],
});