import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import {
	buildIncludeQueryParam,
	planningCenterCommon,
} from '../common/props';

export const getSignupAction = createAction({
	auth: planningCenterAuth,
	name: 'get_signup',
	displayName: 'Get Signup',
	description: 'Gets a single registration signup by ID.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get one signup with optional related campuses, categories, times, and location. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		registration_event: planningCenterCommon.registrationEventDropdown,
		include: planningCenterCommon.signupInclude,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { registration_event, include } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/registrations/v2/signups/${registration_event}`,
			queryParams: buildIncludeQueryParam(include),
		});

		if (!response.body.data) {
			throw new Error('Signup not found.');
		}

		const result: Record<string, unknown> = {
			...planningCenterClient.flattenJsonApiResource(response.body.data),
		};

		if (response.body.included?.length) {
			result['included'] = planningCenterClient.flattenJsonApiCollection(
				response.body.included,
			);
		}

		return result;
	},
});

type JsonApiSingleResponse = {
	data?: {
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	};
	included?: Array<{
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	}>;
};