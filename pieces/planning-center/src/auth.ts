import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { planningCenterRequest } from './common/client';

const authDescription = `
Planning Center Personal Access Tokens use HTTP Basic Auth.

1. Sign in at [Planning Center](https://accounts.planningcenteronline.com).
2. Open [Personal Access Tokens](https://api.planningcenteronline.com/personal_access_tokens).
3. Create a new token with the scopes you need (People, Services, Calendar, etc.).
4. Copy the **Application ID** (client_id) and **Secret** shown once at creation.
5. Paste them here. Never share these credentials publicly.
`;

export const planningCenterAuth = PieceAuth.BasicAuth({
  displayName: 'Personal Access Token',
  description: authDescription,
  required: true,
  username: {
    displayName: 'Application ID',
    description: 'The client_id from your Planning Center Personal Access Token.',
  },
  password: {
    displayName: 'Secret',
    description: 'The secret from your Planning Center Personal Access Token.',
  },
  validate: async ({ auth }) => {
    if (!auth?.username || !auth?.password) {
      return {
        valid: false,
        error: 'Application ID and Secret are required.',
      };
    }

    try {
      await planningCenterRequest({
        auth,
        method: HttpMethod.GET,
        path: '/people/v2/me',
        errorContext: 'Credential validation',
      });

      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Unable to validate credentials. Confirm your Application ID and Secret, and that your token has People access.',
      };
    }
  },
});