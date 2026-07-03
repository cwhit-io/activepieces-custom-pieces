import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

type JsonApiSingleResponse = {
	data?: {
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	};
};

export const addPersonToListAction = createAction({
	auth: planningCenterAuth,
	name: 'add_person_to_list',
	displayName: 'Add Person to List',
	description: 'Adds a person to a static or manual people list.',
	audience: 'both',
	aiMetadata: {
		description:
			'Add a person to a list via PATCH /lists/{id}/people/{id}. Safe to retry if the person is already on the list.',
		idempotent: true,
	},
	props: {
		list: planningCenterCommon.listDropdown,
		person_search: planningCenterCommon.personSearch,
		person: planningCenterCommon.personDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { list, person } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.PATCH,
			path: `/people/v2/lists/${list}/people/${person}`,
			body: {
				data: {
					type: 'Person',
					id: person,
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Failed to add person to list.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});