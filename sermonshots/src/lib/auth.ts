import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sermonshotsClient } from './common/client';

export const sermonshotsAuth = PieceAuth.SecretText({
	displayName: 'API Token',
	description:
		'Your SermonShots API token. Find it in your SermonShots account settings under API access.',
	required: true,
	validate: async ({ auth }) => {
		try {
			await sermonshotsClient.apiCall({
				authToken: auth,
				method: HttpMethod.GET,
				path: '/api/v1/videos',
				queryParams: { page: 1, limit: 1 },
			});
			return { valid: true };
		} catch {
			return {
				valid: false,
				error:
					'Invalid API token. Verify your SermonShots auth-token and try again.',
			};
		}
	},
});