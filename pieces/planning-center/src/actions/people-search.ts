import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { planningCenterAuth } from '../auth';
import { normalizePerson, planningCenterRequest } from '../common/client';
import { JsonApiResponse } from '../common/types';

export const peopleSearch = createAction({
  auth: planningCenterAuth,
  name: 'people_search',
  displayName: 'Search People',
  description: 'Search Planning Center People by name or email.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search Planning Center People records by name or email. Returns a flat array of matching people with id, name, and email addresses. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Name or email to search for.',
      required: true,
    }),
    per_page: Property.Number({
      displayName: 'Results Per Page',
      description: 'Number of results to return (default 25).',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const { query, per_page } = context.propsValue;

    const response = await planningCenterRequest<JsonApiResponse>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/people/v2/people',
      queryParams: {
        'where[search_name_or_email]': query,
        per_page: per_page ?? 25,
        include: 'email_addresses',
      },
      errorContext: 'People search',
    });

    const people = Array.isArray(response.data) ? response.data : response.data ? [response.data] : [];

    return people.map((person) => normalizePerson(person, response.included));
  },
});