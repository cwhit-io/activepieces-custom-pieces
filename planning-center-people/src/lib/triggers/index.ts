import { pcoWebhookTriggers } from '@activepieces/piece-planning-center-common';
import { planningCenterAuth } from '../auth';

export const peopleWebhookTriggers = pcoWebhookTriggers.createForApp({
	auth: planningCenterAuth,
	app: 'people',
});