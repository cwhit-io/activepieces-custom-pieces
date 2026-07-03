import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const createResourceFolderAction = createAction({
	auth: planningCenterAuth,
	name: 'create_resource_folder',
	displayName: 'Create Resource Folder',
	description: 'Creates a folder to organize rooms and resources.',
	audience: 'both',
	aiMetadata: {
		description:
			'Create a calendar resource folder. Each call creates a new folder; retries may duplicate.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The folder name.',
			required: true,
		}),
		kind: planningCenterCommon.resourceKind,
		parent_folder: planningCenterCommon.resourceFolderDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { name, kind, parent_folder } = context.propsValue;

		const attributes: Record<string, unknown> = { name, kind };
		if (parent_folder) {
			attributes['resource_folder_id'] = parent_folder;
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.POST,
			path: '/calendar/v2/resource_folders',
			body: {
				data: {
					type: 'ResourceFolder',
					attributes,
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Failed to create resource folder.');
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