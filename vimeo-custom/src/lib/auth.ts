import { PieceAuth } from '@activepieces/pieces-framework';

const authGuide = `
### Vimeo OAuth setup

1. Log in at [developer.vimeo.com/apps](https://developer.vimeo.com/apps) and create an app.
2. Copy **Client identifier** → **Client ID** below.
3. Copy **Client secrets** → **Client Secret** below.
4. Under **Your callback URLs**, paste the **Redirect URL** from below.
5. Click **Connect** and approve access.

### Download links

Direct download links require the **video_files** scope (included below). After upgrading this piece, **reconnect** your Vimeo connection so the new scope is granted.

Your Vimeo account must also allow downloads on the video (privacy.download) and be on a plan that supports API file access (Standard or above).
`;

export const vimeoAuth = PieceAuth.OAuth2({
	description: authGuide,
	authUrl: 'https://api.vimeo.com/oauth/authorize',
	tokenUrl: 'https://api.vimeo.com/oauth/access_token',
	required: true,
	scope: [
		'public',
		'private',
		'edit',
		'upload',
		'delete',
		'interact',
		'video_files',
	],
});