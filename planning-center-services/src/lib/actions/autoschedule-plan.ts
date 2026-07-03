import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const autoschedulePlanAction = createAction({
	auth: planningCenterAuth,
	name: 'autoschedule_plan',
	displayName: 'Autoschedule Plan',
	description:
		'Automatically fills open volunteer slots on a plan.',
	audience: 'both',
	aiMetadata: {
		description:
			'Run autoschedule on a plan via POST. Fills needed positions from eligible team members. Not idempotent: may create new assignments each run.',
		idempotent: false,
	},
	props: {
		service_type: planningCenterCommon.serviceTypeDropdown,
		plan: planningCenterCommon.planDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { service_type: serviceType, plan } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.POST,
			path: `/services/v2/service_types/${serviceType}/plans/${plan}/autoschedule`,
		});

		if (response.body.data) {
			return planningCenterClient.flattenJsonApiResource(response.body.data);
		}

		return {
			autoscheduled: true,
			plan_id: plan,
			service_type_id: serviceType,
		};
	},
});

type JsonApiSingleResponse = {
	data?: {
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	};
};