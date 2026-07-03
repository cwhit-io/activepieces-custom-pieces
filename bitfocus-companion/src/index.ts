import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { listActivePagesAction } from './lib/actions/list-active-pages';
import { listButtonsOnPageAction } from './lib/actions/list-buttons-on-page';
import { triggerButtonAction } from './lib/actions/trigger-button';
import { companionAuth } from './lib/auth';
import { companionClient } from './lib/common/client';

const COMPANION_LOGO_URL = `data:image/svg+xml,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#1A1A1A"/><rect x="10" y="14" width="44" height="36" rx="6" fill="#2D2D2D"/><rect x="14" y="18" width="10" height="10" rx="2" fill="#F5A623"/><rect x="27" y="18" width="10" height="10" rx="2" fill="#4A90D9"/><rect x="40" y="18" width="10" height="10" rx="2" fill="#7ED321"/><rect x="14" y="31" width="10" height="10" rx="2" fill="#BD10E0"/><rect x="27" y="31" width="10" height="10" rx="2" fill="#F5A623"/><rect x="40" y="31" width="10" height="10" rx="2" fill="#4A90D9"/></svg>',
)}`;

export const bitfocusCompanion = createPiece({
	displayName: 'Bitfocus Companion',
	description:
		'Trigger Companion buttons and discover page layouts via HTTP and Satellite APIs.',
	minimumSupportedRelease: '0.36.1',
	logoUrl: COMPANION_LOGO_URL,
	categories: [PieceCategory.DEVELOPER_TOOLS],
	auth: companionAuth,
	authors: ['activepieces'],
	actions: [
		triggerButtonAction,
		listButtonsOnPageAction,
		listActivePagesAction,
		createCustomApiCallAction({
			auth: companionAuth,
			baseUrl: (auth) => {
				if (!auth) {
					return '';
				}

				return companionClient.baseUrlFromConnection({
					host: auth.props.host,
					port: auth.props.port,
				});
			},
			authMapping: async () => ({}),
		}),
	],
	triggers: [],
});