import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { planningCenterAuth } from '../auth';
import { planningCenterRequestWithMeta } from '../common/client';
import { assertAllowedPath } from '../common/errors';

const methodOptions = [
  { label: 'GET', value: HttpMethod.GET },
  { label: 'POST', value: HttpMethod.POST },
  { label: 'PATCH', value: HttpMethod.PATCH },
  { label: 'DELETE', value: HttpMethod.DELETE },
];

export const customApiCall = createAction({
  auth: planningCenterAuth,
  name: 'custom_api_call',
  displayName: 'Custom API Call',
  description:
    'Call any allowed Planning Center API endpoint. Paths must start with an approved product prefix.',
  audience: 'both',
  aiMetadata: {
    description:
      'Advanced escape hatch for Planning Center API endpoints not covered by built-in actions. Only relative paths under approved product prefixes are allowed. Not idempotent for mutating methods.',
    idempotent: false,
  },
  props: {
    method: Property.StaticDropdown({
      displayName: 'HTTP Method',
      required: true,
      options: {
        options: methodOptions,
      },
      defaultValue: HttpMethod.GET,
    }),
    path: Property.ShortText({
      displayName: 'API Path',
      description: 'Relative path starting with "/" (for example, "/people/v2/people").',
      required: true,
    }),
    queryParams: Property.Object({
      displayName: 'Query Parameters',
      description: 'Optional query string parameters as key/value pairs.',
      required: false,
    }),
    body: Property.Json({
      displayName: 'Request Body',
      description: 'Optional JSON body for POST and PATCH requests.',
      required: false,
    }),
  },
  async run(context) {
    const { method, path, queryParams, body } = context.propsValue;

    assertAllowedPath(path);

    const normalizedQueryParams = queryParams
      ? Object.fromEntries(
          Object.entries(queryParams as Record<string, unknown>).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.map(String).join(',') : String(value),
          ]),
        )
      : undefined;

    const response = await planningCenterRequestWithMeta({
      auth: context.auth,
      method: method as HttpMethod,
      path,
      queryParams: normalizedQueryParams,
      body: body as Record<string, unknown> | undefined,
      errorContext: 'Custom API call',
    });

    return {
      status: response.status,
      headers: response.headers,
      body: response.body,
    };
  },
});