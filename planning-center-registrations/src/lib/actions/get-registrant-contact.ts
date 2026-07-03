import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const getRegistrantContactAction = createAction({
	auth: planningCenterAuth,
	name: 'get_registrant_contact',
	displayName: 'Get Registrant Contact',
	description: 'Gets the registrant contact information for a registration.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get emergency or contact details for the person who submitted a registration. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		registration: planningCenterCommon.registrationDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { registration } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiListResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/registrations/v2/registrations/${registration}/registrant_contact`,
		});

		const resources = response.body.data ?? [];
		if (!resources.length) {
			throw new Error('Registrant contact not found.');
		}

		return planningCenterClient.flattenJsonApiResource(resources[0]);
	},
});

type JsonApiListResponse = {
	data?: Array<{
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	}>;
};