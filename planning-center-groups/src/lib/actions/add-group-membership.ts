import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const addGroupMembershipAction = createAction({
	auth: planningCenterAuth,
	name: 'add_group_membership',
	displayName: 'Add Group Membership',
	description: 'Adds a person to a group as a member or leader.',
	audience: 'both',
	aiMetadata: {
		description:
			'Enroll a person in a group via POST /groups/{id}/memberships. Each call creates a new membership; retries may duplicate if the person is already enrolled.',
		idempotent: false,
	},
	props: {
		group: planningCenterCommon.groupDropdown,
		person_search: planningCenterCommon.personSearch,
		person: planningCenterCommon.personDropdown,
		role: Property.StaticDropdown({
			displayName: 'Role',
			description: 'The role of the person in the group.',
			required: true,
			options: {
				options: [
					{ label: 'Member', value: 'member' },
					{ label: 'Leader', value: 'leader' },
				],
			},
		}),
		joined_at: Property.DateTime({
			displayName: 'Joined At',
			description:
				'Optional. When the person joined the group (ISO 8601). Defaults to now if omitted.',
			required: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { group, person, role, joined_at } = context.propsValue;

		const attributes: Record<string, string> = { role };
		if (joined_at) {
			attributes['joined_at'] = joined_at;
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.POST,
			path: `/groups/v2/groups/${group}/memberships`,
			body: {
				data: {
					type: 'Membership',
					attributes,
					relationships: {
						person: {
							data: {
								type: 'Person',
								id: person,
							},
						},
					},
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Failed to add group membership.');
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