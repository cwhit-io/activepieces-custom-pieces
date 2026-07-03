import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const getGroupAction = createAction({
	auth: planningCenterAuth,
	name: 'get_group',
	displayName: 'Get Group',
	description: 'Gets a single group by ID.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get one Planning Center group including name, schedule, and enrollment settings. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		group: planningCenterCommon.groupDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/groups/v2/groups/${context.propsValue.group}`,
		});

		if (!response.body.data) {
			throw new Error('Group not found.');
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