import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const removeMembershipAction = createAction({
	auth: planningCenterAuth,
	name: 'remove_membership',
	displayName: 'Remove Membership',
	description: 'Removes a person from a group (unenrolls).',
	audience: 'both',
	aiMetadata: {
		description:
			'Delete a group membership to unenroll a person. Destructive; repeating after removal has no further effect.',
		idempotent: false,
	},
	props: {
		group: planningCenterCommon.groupDropdown,
		membership: planningCenterCommon.membershipDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { group, membership } = context.propsValue;

		const response = await planningCenterClient.apiCall({
			credentials,
			method: HttpMethod.DELETE,
			path: `/groups/v2/groups/${group}/memberships/${membership}`,
		});

		if (response.status === 204) {
			return {
				success: true,
				message: `Membership '${membership}' removed from group '${group}'.`,
			};
		}

		return {
			success: false,
			status: response.status,
		};
	},
});