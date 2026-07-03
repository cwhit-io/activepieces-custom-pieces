import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import {
	buildIncludeQueryParam,
	planningCenterCommon,
} from '../common/props';

export const getAttendeeAction = createAction({
	auth: planningCenterAuth,
	name: 'get_attendee',
	displayName: 'Get Attendee',
	description: 'Gets a single attendee by ID with optional related resources.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get one attendee with optional person, registration, selection type, and emergency contact includes. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		attendee: planningCenterCommon.attendeeDropdown,
		include: planningCenterCommon.attendeeInclude,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { attendee, include } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/registrations/v2/attendees/${attendee}`,
			queryParams: buildIncludeQueryParam(include),
		});

		if (!response.body.data) {
			throw new Error('Attendee not found.');
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