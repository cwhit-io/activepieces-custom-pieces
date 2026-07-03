import { pcoWebhookTriggers } from '@activepieces/piece-planning-center-common';
import { planningCenterAuth } from '../auth';

export const servicesWebhookTriggers = pcoWebhookTriggers.createForApp({
	auth: planningCenterAuth,
	app: 'services',
});