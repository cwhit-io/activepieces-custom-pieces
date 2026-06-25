import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpMessageBody,
} from '@activepieces/pieces-common';
import { toPlanningCenterError } from './errors';
import {
  JsonApiResource,
  JsonApiResponse,
  NormalizedEvent,
  NormalizedPerson,
  NormalizedPlan,
  NormalizedPlanItem,
  PLANNING_CENTER_BASE_URL,
  PlanningCenterAuth,
} from './types';

const DEFAULT_USER_AGENT =
  'activepieces-custom-pieces/planning-center (https://github.com/activepieces-custom-pieces)';

function getUserAgent(): string {
  return process.env['PLANNING_CENTER_USER_AGENT'] ?? DEFAULT_USER_AGENT;
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function getIncludedResource(
  included: JsonApiResource[] | undefined,
  type: string,
  id: string,
): JsonApiResource | undefined {
  return included?.find((resource) => resource.type === type && resource.id === id);
}

function normalizeEmailAddresses(
  person: JsonApiResource,
  included?: JsonApiResource[],
): NormalizedPerson['emailAddresses'] {
  const related = person.relationships?.['email_addresses']?.data;
  const relatedResources = asArray(related).filter(Boolean) as JsonApiResource[];

  return relatedResources.map((resource) => {
    const full = getIncludedResource(included, resource.type, resource.id) ?? resource;
    const attributes = full.attributes ?? {};

    return {
      id: full.id,
      address: typeof attributes['address'] === 'string' ? attributes['address'] : null,
      primary: typeof attributes['primary'] === 'boolean' ? attributes['primary'] : null,
    };
  });
}

export function normalizePerson(
  person: JsonApiResource,
  included?: JsonApiResource[],
): NormalizedPerson {
  const attributes = person.attributes ?? {};

  return {
    id: person.id,
    firstName: typeof attributes['first_name'] === 'string' ? attributes['first_name'] : null,
    lastName: typeof attributes['last_name'] === 'string' ? attributes['last_name'] : null,
    name: typeof attributes['name'] === 'string' ? attributes['name'] : null,
    emailAddresses: normalizeEmailAddresses(person, included),
    raw: person,
  };
}

export function normalizePlan(plan: JsonApiResource): NormalizedPlan {
  const attributes = plan.attributes ?? {};

  return {
    id: plan.id,
    title: typeof attributes['title'] === 'string' ? attributes['title'] : null,
    dates: typeof attributes['dates'] === 'string' ? attributes['dates'] : null,
    sortDate: typeof attributes['sort_date'] === 'string' ? attributes['sort_date'] : null,
    status: typeof attributes['status'] === 'string' ? attributes['status'] : null,
    raw: plan,
  };
}

export function normalizePlanItem(item: JsonApiResource): NormalizedPlanItem {
  const attributes = item.attributes ?? {};

  return {
    id: item.id,
    title: typeof attributes['title'] === 'string' ? attributes['title'] : null,
    itemType: typeof attributes['item_type'] === 'string' ? attributes['item_type'] : null,
    sequence: typeof attributes['sequence'] === 'number' ? attributes['sequence'] : null,
    raw: item,
  };
}

export function normalizeEvent(event: JsonApiResource): NormalizedEvent {
  const attributes = event.attributes ?? {};

  return {
    id: event.id,
    name: typeof attributes['name'] === 'string' ? attributes['name'] : null,
    startsAt: typeof attributes['starts_at'] === 'string' ? attributes['starts_at'] : null,
    endsAt: typeof attributes['ends_at'] === 'string' ? attributes['ends_at'] : null,
    location: typeof attributes['location'] === 'string' ? attributes['location'] : null,
    raw: event,
  };
}

export async function planningCenterRequest<T extends HttpMessageBody = JsonApiResponse>({
  auth,
  method,
  path,
  queryParams,
  body,
  errorContext,
}: {
  auth: PlanningCenterAuth;
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string | number | string[] | undefined>;
  body?: Record<string, unknown>;
  errorContext: string;
}): Promise<T> {
  const normalizedQueryParams = queryParams
    ? Object.fromEntries(
        Object.entries(queryParams)
          .filter(([, value]) => value !== undefined && value !== null && value !== '')
          .map(([key, value]) => [key, String(value)]),
      )
    : undefined;

  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${PLANNING_CENTER_BASE_URL}${path}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.username,
        password: auth.password,
      },
      headers: {
        'User-Agent': getUserAgent(),
        Accept: 'application/json',
      },
      queryParams: normalizedQueryParams,
      body,
    });

    return response.body;
  } catch (error) {
    throw toPlanningCenterError(error, errorContext);
  }
}

export async function planningCenterRequestWithMeta<T extends HttpMessageBody = JsonApiResponse>({
  auth,
  method,
  path,
  queryParams,
  body,
  errorContext,
}: {
  auth: PlanningCenterAuth;
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string | number | string[] | undefined>;
  body?: Record<string, unknown>;
  errorContext: string;
}) {
  const normalizedQueryParams = queryParams
    ? Object.fromEntries(
        Object.entries(queryParams)
          .filter(([, value]) => value !== undefined && value !== null && value !== '')
          .map(([key, value]) => [key, String(value)]),
      )
    : undefined;

  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${PLANNING_CENTER_BASE_URL}${path}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.username,
        password: auth.password,
      },
      headers: {
        'User-Agent': getUserAgent(),
        Accept: 'application/json',
      },
      queryParams: normalizedQueryParams,
      body,
    });

    return {
      status: response.status,
      headers: response.headers,
      body: response.body,
    };
  } catch (error) {
    throw toPlanningCenterError(error, errorContext);
  }
}