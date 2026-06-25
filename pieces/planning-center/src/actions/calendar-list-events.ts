import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { planningCenterAuth } from '../auth';
import { normalizeEvent, planningCenterRequest } from '../common/client';
import { JsonApiResponse } from '../common/types';

export const calendarListEvents = createAction({
  auth: planningCenterAuth,
  name: 'calendar_list_events',
  displayName: 'List Calendar Events',
  description: 'List Planning Center Calendar events within an optional date range.',
  audience: 'both',
  aiMetadata: {
    description:
      'List calendar events, optionally filtered by starts_after and starts_before. Returns normalized event records. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    startsAfter: Property.DateTime({
      displayName: 'Starts After',
      description: 'Only return events starting after this date/time (ISO 8601).',
      required: false,
    }),
    startsBefore: Property.DateTime({
      displayName: 'Starts Before',
      description: 'Only return events starting before this date/time (ISO 8601).',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Results Per Page',
      description: 'Number of events to return (default 25).',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const { startsAfter, startsBefore, per_page } = context.propsValue;

    const response = await planningCenterRequest<JsonApiResponse>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/calendar/v2/events',
      queryParams: {
        'filter[starts_after]': startsAfter ?? undefined,
        'filter[starts_before]': startsBefore ?? undefined,
        per_page: per_page ?? 25,
      },
      errorContext: 'List calendar events',
    });

    const events = Array.isArray(response.data) ? response.data : response.data ? [response.data] : [];

    return events.map(normalizeEvent);
  },
});