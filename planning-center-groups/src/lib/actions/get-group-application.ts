import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const getGroupApplicationAction = createAction({
	auth: planningCenterAuth,
	name: 'get_group_application',
	displayName: 'Get Group Application',
	description: 'Gets a single group join request by ID.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get one group application including status, message, and applied_at. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		group_application: planningCenterCommon.groupApplicationDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/groups/v2/group_applications/${context.propsValue.group_application}`,
		});

		if (!response.body.data) {
			throw new Error('Group application not found.');
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