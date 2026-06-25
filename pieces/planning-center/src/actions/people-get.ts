import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { planningCenterAuth } from '../auth';
import { normalizePerson, planningCenterRequest } from '../common/client';
import { JsonApiResource, JsonApiResponse } from '../common/types';

function normalizePhoneNumbers(
  phoneNumbers: JsonApiResource[],
): Array<{ id: string; number: string | null; primary: boolean | null; location: string | null }> {
  return phoneNumbers.map((phone) => {
    const attributes = phone.attributes ?? {};
    return {
      id: phone.id,
      number: typeof attributes['number'] === 'string' ? attributes['number'] : null,
      primary: typeof attributes['primary'] === 'boolean' ? attributes['primary'] : null,
      location: typeof attributes['location'] === 'string' ? attributes['location'] : null,
    };
  });
}

export const peopleGet = createAction({
  auth: planningCenterAuth,
  name: 'people_get',
  displayName: 'Get Person',
  description: 'Get a Planning Center person by ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch a single Planning Center person by person ID. Optionally include email addresses and phone numbers. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    personId: Property.ShortText({
      displayName: 'Person ID',
      description: 'The Planning Center person ID.',
      required: true,
    }),
    includeEmails: Property.Checkbox({
      displayName: 'Include Email Addresses',
      description: 'Include related email addresses in the response.',
      required: false,
      defaultValue: true,
    }),
    includePhoneNumbers: Property.Checkbox({
      displayName: 'Include Phone Numbers',
      description: 'Include related phone numbers in the response.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { personId, includeEmails, includePhoneNumbers } = context.propsValue;

    const includeParts: string[] = [];
    if (includeEmails !== false) {
      includeParts.push('email_addresses');
    }
    if (includePhoneNumbers) {
      includeParts.push('phone_numbers');
    }

    const response = await planningCenterRequest<JsonApiResponse>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/people/v2/people/${personId}`,
      queryParams: includeParts.length > 0 ? { include: includeParts.join(',') } : undefined,
      errorContext: 'Get person',
    });

    if (!response.data || Array.isArray(response.data)) {
      throw new Error('Get person: Unexpected API response.');
    }

    const normalized = normalizePerson(response.data, response.included);

    const phoneResources = (response.included ?? []).filter((resource) => resource.type === 'PhoneNumber');

    return {
      ...normalized,
      phoneNumbers: includePhoneNumbers ? normalizePhoneNumbers(phoneResources) : undefined,
      raw: response,
    };
  },
});