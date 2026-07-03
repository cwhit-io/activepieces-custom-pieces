import { pcoWebhookTriggers } from '@activepieces/piece-planning-center-common';
import { planningCenterAuth } from '../auth';

export const groupsWebhookTriggers = pcoWebhookTriggers.createForApp({
	auth: planningCenterAuth,
	app: 'groups',
});