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

export const createPersonEmailAction = createAction({
	auth: planningCenterAuth,
	name: 'create_person_email',
	displayName: 'Create Email',
	description: 'Adds an email address to a person profile.',
	audience: 'both',
	aiMetadata: {
		description:
			'Create an email on a person via POST /people/{id}/emails. Each call adds a new email; retries may duplicate.',
		idempotent: false,
	},
	props: {
		person: planningCenterCommon.personDropdown,
		address: Property.ShortText({
			displayName: 'Email Address',
			description: 'The email address to add.',
			required: true,
		}),
		location: planningCenterCommon.contactLocation,
		primary: Property.Checkbox({
			displayName: 'Primary',
			description: 'Set as the primary email for this person.',
			required: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { person, address, location, primary } = context.propsValue;

		const attributes: Record<string, unknown> = {
			address: address.trim(),
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
			path: `/people/v2/people/${person}/emails`,
			body: {
				data: {
					type: 'Email',
					attributes,
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Failed to create email.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});