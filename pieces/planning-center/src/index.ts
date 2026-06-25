import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { planningCenterAuth } from './auth';
import { peopleSearch } from './actions/people-search';
import { peopleGet } from './actions/people-get';
import { servicesListPlans } from './actions/services-list-plans';
import { servicesGetPlan } from './actions/services-get-plan';
import { calendarListEvents } from './actions/calendar-list-events';
import { customApiCall } from './actions/custom-api-call';

export const planningCenter = createPiece({
  displayName: 'Planning Center',
  description:
    'Connect to Planning Center for People, Services, Calendar, and other church management workflows.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://www.planningcenter.com/apple-touch-icon.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['activepieces-custom-pieces'],
  auth: planningCenterAuth,
  actions: [
    peopleSearch,
    peopleGet,
    servicesListPlans,
    servicesGetPlan,
    calendarListEvents,
    customApiCall,
  ],
  triggers: [],
});