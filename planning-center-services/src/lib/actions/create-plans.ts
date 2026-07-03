import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const createPlansAction = createAction({
	auth: planningCenterAuth,
	name: 'create_plans',
	displayName: 'Create Plans',
	description:
		'Bulk-creates upcoming service plans for a service type.',
	audience: 'both',
	aiMetadata: {
		description:
			'Create upcoming plans for a service type via POST create_plans. Uses the service type schedule to generate new plan dates. Not idempotent: may create duplicate plans if run repeatedly.',
		idempotent: false,
	},
	props: {
		service_type: planningCenterCommon.serviceTypeDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { service_type: serviceType } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiListResponse>({
			credentials,
			method: HttpMethod.POST,
			path: `/services/v2/service_types/${serviceType}/create_plans`,
		});

		if (response.body.data?.length) {
			return planningCenterClient.flattenJsonApiCollection(response.body.data);
		}

		return {
			created: true,
			service_type_id: serviceType,
		};
	},
});

type JsonApiListResponse = {
	data?: {
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	}[];
};