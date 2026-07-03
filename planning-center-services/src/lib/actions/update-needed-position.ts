import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const updateNeededPositionAction = createAction({
	auth: planningCenterAuth,
	name: 'update_needed_position',
	displayName: 'Update Needed Position',
	description: 'Adjusts the quantity of an open volunteer slot on a plan.',
	audience: 'both',
	aiMetadata: {
		description:
			'Patch a needed position on a plan. Adjust the quantity of open slots. Provide a new quantity to update.',
		idempotent: true,
	},
	props: {
		service_type: planningCenterCommon.serviceTypeDropdown,
		plan: planningCenterCommon.planDropdown,
		needed_position: planningCenterCommon.neededPositionDropdown,
		quantity: Property.Number({
			displayName: 'Quantity',
			description: 'New number of open positions needed.',
			required: true,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			service_type: serviceType,
			plan,
			needed_position: neededPosition,
			quantity,
		} = context.propsValue;

		if (quantity === undefined || quantity === null) {
			throw new Error('Quantity is required.');
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.PATCH,
			path: `/services/v2/service_types/${serviceType}/plans/${plan}/needed_positions/${neededPosition}`,
			body: {
				data: {
					type: 'NeededPosition',
					attributes: {
						quantity: Number(quantity),
					},
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Needed position update succeeded but no data was returned.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});

type JsonApiSingleResponse = {
	data?: {
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	};
};