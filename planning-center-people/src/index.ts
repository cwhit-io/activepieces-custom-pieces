import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { planningCenterAuth } from './lib/auth';
import { listPeopleAction } from './lib/actions/list-people';
import { getPersonAction } from './lib/actions/get-person';
import { listPersonEmailsAction } from './lib/actions/list-person-emails';
import { listPersonPhoneNumbersAction } from './lib/actions/list-person-phone-numbers';
import { listPersonAddressesAction } from './lib/actions/list-person-addresses';
import { listFieldDataAction } from './lib/actions/list-field-data';
import { listListsAction } from './lib/actions/list-lists';
import { listListPeopleAction } from './lib/actions/list-list-people';
import { planningCenterClient } from './lib/common/client';

const PLANNING_CENTER_PEOPLE_LOGO_URL = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#3B82F6"/><circle cx="32" cy="24" r="10" fill="#fff"/><path d="M16 52c0-9 7-16 16-16s16 7 16 16" fill="#fff"/></svg>',
)}`;

export const planningCenterPeople = createPiece({
	displayName: 'Planning Center People',
	description: 'People profiles, contact info, custom fields, and lists for Planning Center.',
	minimumSupportedRelease: '0.36.1',
	logoUrl: PLANNING_CENTER_PEOPLE_LOGO_URL,
	categories: [PieceCategory.PRODUCTIVITY],
	auth: planningCenterAuth,
	authors: ['activepieces'],
	actions: [
		listPeopleAction,
		getPersonAction,
		listPersonEmailsAction,
		listPersonPhoneNumbersAction,
		listPersonAddressesAction,
		listFieldDataAction,
		listListsAction,
		listListPeopleAction,
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
					'User-Agent': 'Activepieces Planning Center People (https://activepieces.com)',
				};
			},
		}),
	],
	triggers: [],
});
