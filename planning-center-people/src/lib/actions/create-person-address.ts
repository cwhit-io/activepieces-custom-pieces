import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

type JsonApiSingleResponse = {
	data?: {
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	};
};

export const createPersonAddressAction = createAction({
	auth: planningCenterAuth,
	name: 'create_person_address',
	displayName: 'Create Address',
	description: 'Adds a postal address to a person profile.',
	audience: 'both',
	aiMetadata: {
		description:
			'Create an address on a person via POST /people/{id}/addresses. Each call adds a new address; retries may duplicate.',
		idempotent: false,
	},
	props: {
		person: planningCenterCommon.personDropdown,
		street_line_1: Property.ShortText({
			displayName: 'Street Line 1',
			description: 'Primary street address line.',
			required: true,
		}),
		street_line_2: Property.ShortText({
			displayName: 'Street Line 2',
			description: 'Optional. Apartment, suite, or unit.',
			required: false,
		}),
		city: Property.ShortText({
			displayName: 'City',
			description: 'City name.',
			required: false,
		}),
		state: Property.ShortText({
			displayName: 'State',
			description: 'State or province.',
			required: false,
		}),
		zip: Property.ShortText({
			displayName: 'ZIP / Postal Code',
			description: 'ZIP or postal code.',
			required: false,
		}),
		country_code: Property.ShortText({
			displayName: 'Country Code',
			description: 'Optional. Two-letter country code (e.g. US).',
			required: false,
		}),
		location: planningCenterCommon.contactLocation,
		primary: Property.Checkbox({
			displayName: 'Primary',
			description: 'Set as the primary address for this person.',
			required: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			person,
			street_line_1: streetLine1,
			street_line_2: streetLine2,
			city,
			state,
			zip,
			country_code: countryCode,
			location,
			primary,
		} = context.propsValue;

		const attributes: Record<string, unknown> = {
			street_line_1: streetLine1.trim(),
		};

		if (typeof streetLine2 === 'string' && streetLine2.trim().length > 0) {
			attributes['street_line_2'] = streetLine2.trim();
		}
		if (typeof city === 'string' && city.trim().length > 0) {
			attributes['city'] = city.trim();
		}
		if (typeof state === 'string' && state.trim().length > 0) {
			attributes['state'] = state.trim();
		}
		if (typeof zip === 'string' && zip.trim().length > 0) {
			attributes['zip'] = zip.trim();
		}
		if (typeof countryCode === 'string' && countryCode.trim().length > 0) {
			attributes['country_code'] = countryCode.trim();
		}
		if (typeof location === 'string' && location.length > 0) {
			attributes['location'] = location;
		}
		if (primary === true) {
			attributes['primary'] = true;
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.POST,
			path: `/people/v2/people/${person}/addresses`,
			body: {
				data: {
					type: 'Address',
					attributes,
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Failed to create address.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});