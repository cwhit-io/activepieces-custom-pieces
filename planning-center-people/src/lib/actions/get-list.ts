import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
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

export const getListAction = createAction({
	auth: planningCenterAuth,
	name: 'get_list',
	displayName: 'Get List',
	description: 'Gets metadata for a single people list.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get one people list including name, description, and member count. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		list: planningCenterCommon.listDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { list } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/people/v2/lists/${list}`,
		});

		if (!response.body.data) {
			throw new Error('List not found.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});