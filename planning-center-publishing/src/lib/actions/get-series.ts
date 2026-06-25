import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const getSeriesAction = createAction({
	auth: planningCenterAuth,
	name: 'get_series',
	displayName: 'Get Series',
	description: 'Gets a single series.',
	audience: 'both',
	aiMetadata: {
		description: 'Get one sermon series by id. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		series: planningCenterCommon.seriesDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { series } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/publishing/v2/series/${series}`,
		});

		if (!response.body.data) {
			throw new Error('Resource not found.');
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
