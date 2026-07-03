import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const getAttendeeSelectionTypeAction = createAction({
	auth: planningCenterAuth,
	name: 'get_attendee_selection_type',
	displayName: 'Get Attendee Selection Type',
	description: 'Gets the selection type (ticket/option) for an attendee.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get the selection type purchased or assigned to an attendee. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		attendee: planningCenterCommon.attendeeDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { attendee } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiListResponse>({
			credentials,
			method: HttpMethod.GET,
			path: `/registrations/v2/attendees/${attendee}/selection_type`,
		});

		const resources = response.body.data ?? [];
		if (!resources.length) {
			throw new Error('Selection type not found for attendee.');
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