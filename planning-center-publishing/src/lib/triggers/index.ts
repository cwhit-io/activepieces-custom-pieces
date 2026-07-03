import { pcoWebhookTriggers } from '@activepieces/piece-planning-center-common';
import { planningCenterAuth } from '../auth';

export const publishingWebhookTriggers = pcoWebhookTriggers.createForApp({
	auth: planningCenterAuth,
	app: 'publishing',
});