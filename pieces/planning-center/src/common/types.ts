export const PLANNING_CENTER_BASE_URL = 'https://api.planningcenteronline.com';

export const ALLOWED_API_PREFIXES = [
  '/people/',
  '/services/',
  '/calendar/',
  '/groups/',
  '/registrations/',
  '/giving/',
  '/check-ins/',
  '/publishing/',
] as const;

export type PlanningCenterAuth = {
  username: string;
  password: string;
};

export type JsonApiResource = {
  type: string;
  id: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, { data?: JsonApiResource | JsonApiResource[] | null }>;
};

export type JsonApiResponse = {
  data?: JsonApiResource | JsonApiResource[];
  included?: JsonApiResource[];
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export type NormalizedPerson = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  emailAddresses: Array<{ id: string; address: string | null; primary: boolean | null }>;
  raw: JsonApiResource;
};

export type NormalizedPlan = {
  id: string;
  title: string | null;
  dates: string | null;
  sortDate: string | null;
  status: string | null;
  raw: JsonApiResource;
};

export type NormalizedPlanItem = {
  id: string;
  title: string | null;
  itemType: string | null;
  sequence: number | null;
  raw: JsonApiResource;
};

export type NormalizedEvent = {
  id: string;
  name: string | null;
  startsAt: string | null;
  endsAt: string | null;
  location: string | null;
  raw: JsonApiResource;
};