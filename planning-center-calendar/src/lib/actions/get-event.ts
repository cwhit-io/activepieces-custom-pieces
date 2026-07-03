import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const getEventAction = createAction({
	auth: planningCenterAuth,
	name: 'get_event',
	displayName: 'Get Event',
	description: 'Gets a single calendar event by ID.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get one calendar event including approval status, visibility, and summary. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		calendar_event: planningCenterCommon.calendarEventDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/calendar/v2/events/${context.propsValue.calendar_event}`,
		});

		if (!response.body.data) {
			throw new Error('Event not found.');
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