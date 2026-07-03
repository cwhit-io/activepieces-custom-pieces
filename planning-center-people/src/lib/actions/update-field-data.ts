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

export const updateFieldDataAction = createAction({
	auth: planningCenterAuth,
	name: 'update_field_data',
	displayName: 'Update Field Data',
	description: 'Updates a custom profile field value.',
	audience: 'both',
	aiMetadata: {
		description:
			'Patch a custom field value via PATCH /field_data/{id}. Provide a new value. Safe to retry with the same value.',
		idempotent: true,
	},
	props: {
		field_data: planningCenterCommon.fieldDataDropdown,
		value: Property.LongText({
			displayName: 'Value',
			description: 'The new value for this custom field.',
			required: true,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { field_data: fieldData, value } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.PATCH,
			path: `/people/v2/field_data/${fieldData}`,
			body: {
				data: {
					type: 'FieldDatum',
					attributes: {
						value,
					},
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Field data update succeeded but no data was returned.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});