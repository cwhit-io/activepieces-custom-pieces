import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const createResourceAction = createAction({
	auth: planningCenterAuth,
	name: 'create_resource',
	displayName: 'Create Resource',
	description: 'Creates a new room or equipment resource.',
	audience: 'both',
	aiMetadata: {
		description:
			'Create a calendar room or equipment resource. Each call creates a new resource; retries may duplicate.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The name of the room or resource.',
			required: true,
		}),
		kind: planningCenterCommon.resourceKind,
		description: Property.LongText({
			displayName: 'Description',
			description: 'Optional description of the room or resource.',
			required: false,
		}),
		home_location: Property.ShortText({
			displayName: 'Home Location',
			description: 'Where the resource is normally kept.',
			required: false,
		}),
		quantity: Property.Number({
			displayName: 'Quantity',
			description: 'Optional quantity for equipment resources.',
			required: false,
		}),
		serial_number: Property.ShortText({
			displayName: 'Serial Number',
			description: 'Optional serial number for equipment resources.',
			required: false,
		}),
		resource_folder: planningCenterCommon.resourceFolderDropdown,
		expires_at: Property.DateTime({
			displayName: 'Expires At',
			description: 'Optional UTC expiration date/time (ISO 8601).',
			required: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			name,
			kind,
			description,
			home_location,
			quantity,
			serial_number,
			resource_folder,
			expires_at,
		} = context.propsValue;

		const attributes: Record<string, unknown> = { name, kind };
		if (description) {
			attributes['description'] = description;
		}
		if (home_location) {
			attributes['home_location'] = home_location;
		}
		if (quantity !== undefined && quantity !== null) {
			attributes['quantity'] = quantity;
		}
		if (serial_number) {
			attributes['serial_number'] = serial_number;
		}
		if (resource_folder) {
			attributes['resource_folder_id'] = resource_folder;
		}
		if (expires_at) {
			attributes['expires_at'] = expires_at;
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.POST,
			path: '/calendar/v2/resources',
			body: {
				data: {
					type: 'Resource',
					attributes,
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Failed to create resource.');
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