import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const removePersonFromListAction = createAction({
	auth: planningCenterAuth,
	name: 'remove_person_from_list',
	displayName: 'Remove Person from List',
	description: 'Removes a person from a people list.',
	audience: 'both',
	aiMetadata: {
		description:
			'Remove a person from a list via DELETE /lists/{id}/people/{id}. Destructive; repeating after removal has no further effect.',
		idempotent: false,
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

		const response = await planningCenterClient.apiCall({
			credentials,
			method: HttpMethod.DELETE,
			path: `/people/v2/lists/${list}/people/${person}`,
		});

		if (response.status === 204) {
			return {
				success: true,
				message: `Person '${person}' removed from list '${list}'.`,
			};
		}

		return {
			success: false,
			status: response.status,
		};
	},
});