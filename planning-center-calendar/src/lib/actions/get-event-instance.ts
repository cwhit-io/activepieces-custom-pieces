import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const getEventInstanceAction = createAction({
	auth: planningCenterAuth,
	name: 'get_event_instance',
	displayName: 'Get Event Instance',
	description: 'Gets a single event occurrence by ID.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get one event instance including start/end times and location. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		event_instance: planningCenterCommon.calendarEventInstanceDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/calendar/v2/event_instances/${context.propsValue.event_instance}`,
		});

		if (!response.body.data) {
			throw new Error('Event instance not found.');
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