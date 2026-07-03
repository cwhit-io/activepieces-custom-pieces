import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { planningCenterClient } from './common/client';

export const planningCenterAuth = PieceAuth.CustomAuth({
	displayName: 'Personal Access Token',
	description:
		'Connect with a Planning Center Personal Access Token using HTTP Basic Auth.',
	required: true,
	props: {
		setup_instructions: Property.MarkDown({
			value: `## Setup Instructions
1. Sign in to your [Planning Center developer account](https://api.planningcenteronline.com/personal_access_tokens)
2. Create a new **Personal Access Token**
3. Copy the **Application ID** and **Secret**
4. Paste them into the fields below

Webhook triggers require permission to manage Planning Center webhook subscriptions.`,
		}),
		application_id: Property.ShortText({
			displayName: 'Application ID',
			description:
				'The Application ID (client_id) shown when you create a Personal Access Token.',
			required: true,
		}),
		secret: PieceAuth.SecretText({
			displayName: 'Secret',
			description:
				'The Secret shown once when you create a Personal Access Token. Store it securely.',
			required: true,
		}),
	},
	validate: async ({ auth }) => {
		try {
			await planningCenterClient.apiCall({
				credentials: {
					applicationId: auth.application_id,
					secret: auth.secret,
				},
				method: HttpMethod.GET,
				path: '/calendar/v2/events',
				queryParams: { per_page: '1' },
			});
			return { valid: true };
		} catch {
			return {
				valid: false,
				error:
					'Invalid Application ID or Secret. Verify your Personal Access Token and Calendar permissions.',
			};
		}
	},
});
