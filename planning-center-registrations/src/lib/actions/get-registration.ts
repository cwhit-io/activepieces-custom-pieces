import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import {
	buildIncludeQueryParam,
	planningCenterCommon,
} from '../common/props';

export const getRegistrationAction = createAction({
	auth: planningCenterAuth,
	name: 'get_registration',
	displayName: 'Get Registration',
	description: 'Gets a single registration record by ID.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get one registration with optional created_by and registrant_contact includes. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		registration: planningCenterCommon.registrationDropdown,
		include: planningCenterCommon.registrationInclude,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { registration, include } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/registrations/v2/registrations/${registration}`,
			queryParams: buildIncludeQueryParam(include),
		});

		if (!response.body.data) {
			throw new Error('Registration not found.');
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