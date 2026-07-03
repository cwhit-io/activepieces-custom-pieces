import { pcoWebhookTriggers } from '@activepieces/piece-planning-center-common';
import { planningCenterAuth } from '../auth';

export const calendarWebhookTriggers = pcoWebhookTriggers.createForApp({
	auth: planningCenterAuth,
	app: 'calendar',
});