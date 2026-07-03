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

export const createPersonPhoneNumberAction = createAction({
	auth: planningCenterAuth,
	name: 'create_person_phone_number',
	displayName: 'Create Phone Number',
	description: 'Adds a phone number to a person profile.',
	audience: 'both',
	aiMetadata: {
		description:
			'Create a phone number on a person via POST /people/{id}/phone_numbers. Each call adds a new number; retries may duplicate.',
		idempotent: false,
	},
	props: {
		person: planningCenterCommon.personDropdown,
		number: Property.ShortText({
			displayName: 'Phone Number',
			description: 'The phone number to add (e.g. 555-123-4567).',
			required: true,
		}),
		location: planningCenterCommon.contactLocation,
		primary: Property.Checkbox({
			displayName: 'Primary',
			description: 'Set as the primary phone number for this person.',
			required: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { person, number, location, primary } = context.propsValue;

		const attributes: Record<string, unknown> = {
			number: number.trim(),
		};
		if (typeof location === 'string' && location.length > 0) {
			attributes['location'] = location;
		}
		if (primary === true) {
			attributes['primary'] = true;
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.POST,
			path: `/people/v2/people/${person}/phone_numbers`,
			body: {
				data: {
					type: 'PhoneNumber',
					attributes,
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Failed to create phone number.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});