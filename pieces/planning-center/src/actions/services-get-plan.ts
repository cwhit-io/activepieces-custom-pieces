import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { planningCenterAuth } from '../auth';
import { normalizePlan, normalizePlanItem, planningCenterRequest } from '../common/client';
import { JsonApiResponse } from '../common/types';

export const servicesGetPlan = createAction({
  auth: planningCenterAuth,
  name: 'services_get_plan',
  displayName: 'Get Service Plan',
  description: 'Get a single Planning Center Services plan, optionally including plan items.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch one service plan by service type ID and plan ID. Optionally include plan items (songs, headers, etc.). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    serviceTypeId: Property.ShortText({
      displayName: 'Service Type ID',
      description: 'The Planning Center Services service type ID.',
      required: true,
    }),
    planId: Property.ShortText({
      displayName: 'Plan ID',
      description: 'The Planning Center Services plan ID.',
      required: true,
    }),
    includeItems: Property.Checkbox({
      displayName: 'Include Plan Items',
      description: 'Fetch and include plan items (songs, media, headers, etc.).',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { serviceTypeId, planId, includeItems } = context.propsValue;

    const planResponse = await planningCenterRequest<JsonApiResponse>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/services/v2/service_types/${serviceTypeId}/plans/${planId}`,
      errorContext: 'Get service plan',
    });

    if (!planResponse.data || Array.isArray(planResponse.data)) {
      throw new Error('Get service plan: Unexpected API response.');
    }

    const normalizedPlan = normalizePlan(planResponse.data);

    if (includeItems === false) {
      return {
        ...normalizedPlan,
        items: [],
        raw: planResponse,
      };
    }

    const itemsResponse = await planningCenterRequest<JsonApiResponse>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/services/v2/service_types/${serviceTypeId}/plans/${planId}/items`,
      errorContext: 'Get service plan items',
    });

    const items = Array.isArray(itemsResponse.data)
      ? itemsResponse.data
      : itemsResponse.data
        ? [itemsResponse.data]
        : [];

    return {
      ...normalizedPlan,
      items: items.map(normalizePlanItem),
      raw: {
        plan: planResponse,
        items: itemsResponse,
      },
    };
  },
});