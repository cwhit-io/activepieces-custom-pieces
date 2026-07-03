import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const getAttendeePersonAction = createAction({
	auth: planningCenterAuth,
	name: 'get_attendee_person',
	displayName: 'Get Attendee Person',
	description: 'Gets the person record linked to an attendee.',
	audience: 'both',
	aiMetadata: {
		description:
			'Get the People profile for a Registrations attendee. Read-only and safe to retry.',
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
			path: `/registrations/v2/attendees/${attendee}/person`,
		});

		const resources = response.body.data ?? [];
		if (!resources.length) {
			throw new Error('Person not found for attendee.');
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