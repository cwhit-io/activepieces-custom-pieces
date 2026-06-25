import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const getPlanAction = createAction({
	auth: planningCenterAuth,
	name: 'get_plan',
	displayName: 'Get Plan',
	description: 'Gets metadata for a single plan.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get a single plan by service type and plan id. Use when you need plan details (title, dates, notes) for one service. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		service_type: planningCenterCommon.serviceTypeDropdown,
		plan: planningCenterCommon.planDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { service_type, plan } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/services/v2/service_types/${service_type}/plans/${plan}`,
		});

		if (!response.body.data) {
			throw new Error('Plan not found.');
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