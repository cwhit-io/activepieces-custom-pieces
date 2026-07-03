import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const updateMembershipAction = createAction({
	auth: planningCenterAuth,
	name: 'update_membership',
	displayName: 'Update Membership',
	description: 'Updates a group membership role or joined date.',
	audience: 'both',
	aiMetadata: {
		description:
			'Patch a group membership role or joined_at. Provide at least one field to change. Safe to retry with the same values.',
		idempotent: true,
	},
	props: {
		group: planningCenterCommon.groupDropdown,
		membership: planningCenterCommon.membershipDropdown,
		role: Property.StaticDropdown({
			displayName: 'Role',
			description: 'New role in the group. Leave empty to keep unchanged.',
			required: false,
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
				'New joined date (ISO 8601). Leave empty to keep unchanged.',
			required: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { group, membership, role, joined_at } = context.propsValue;

		const attributes: Record<string, string> = {};
		if (role) {
			attributes['role'] = role;
		}
		if (joined_at) {
			attributes['joined_at'] = joined_at;
		}

		if (Object.keys(attributes).length === 0) {
			throw new Error('Provide at least one field to update (role or joined_at).');
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.PATCH,
			path: `/groups/v2/groups/${group}/memberships/${membership}`,
			body: {
				data: {
					type: 'Membership',
					attributes,
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Failed to update membership.');
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