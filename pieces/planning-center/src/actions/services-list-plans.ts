import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { planningCenterAuth } from '../auth';
import { normalizePlan, planningCenterRequest } from '../common/client';
import { JsonApiResponse } from '../common/types';

export const servicesListPlans = createAction({
  auth: planningCenterAuth,
  name: 'services_list_plans',
  displayName: 'List Service Plans',
  description: 'List Planning Center Services plans for a service type.',
  audience: 'both',
  aiMetadata: {
    description:
      'List service plans for a given service type ID. Supports optional filters (future, past, no_dates) and pagination. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    serviceTypeId: Property.ShortText({
      displayName: 'Service Type ID',
      description: 'The Planning Center Services service type ID.',
      required: true,
    }),
    filter: Property.StaticDropdown({
      displayName: 'Filter',
      description: 'Optional plan filter.',
      required: false,
      options: {
        options: [
          { label: 'All plans', value: '' },
          { label: 'Future', value: 'future' },
          { label: 'Past', value: 'past' },
          { label: 'No dates', value: 'no_dates' },
        ],
      },
    }),
    per_page: Property.Number({
      displayName: 'Results Per Page',
      description: 'Number of plans to return (default 25).',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const { serviceTypeId, filter, per_page } = context.propsValue;

    const response = await planningCenterRequest<JsonApiResponse>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/services/v2/service_types/${serviceTypeId}/plans`,
      queryParams: {
        filter: filter || undefined,
        per_page: per_page ?? 25,
      },
      errorContext: 'List service plans',
    });

    const plans = Array.isArray(response.data) ? response.data : response.data ? [response.data] : [];

    return plans.map(normalizePlan);
  },
});