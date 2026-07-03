import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const getGroupEventAction = createAction({
	auth: planningCenterAuth,
	name: 'get_group_event',
	displayName: 'Get Group Event',
	description: 'Gets a single group event by ID (time, location, and settings).',
	audience: 'both',
	aiMetadata: {
		description:
			'Get one group event by ID including starts_at, ends_at, and location. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		event: planningCenterCommon.eventDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/groups/v2/events/${context.propsValue.event}`,
		});

		if (!response.body.data) {
			throw new Error('Group event not found.');
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