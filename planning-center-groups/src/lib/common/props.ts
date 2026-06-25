import { Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';

export const planningCenterCommon = {	fetchAllPages: Property.Checkbox({
		displayName: 'Fetch All Pages',
		description:
			'When enabled, automatically fetches every page of results (up to API limits).',
		required: false,
		defaultValue: true,
	}),
	groupDropdown: Property.Dropdown({
		displayName: 'Group',
		description: 'The group to query.',
		auth: planningCenterAuth,
		refreshers: [],
		required: true,
		options: async ({ auth }) => {
			if (!auth) {
				return { disabled: true, options: [], placeholder: 'Connect your account first' };
			}
			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(auth.props);
				const resources = await planningCenterClient.paginatedApiCall({
					credentials,
					path: '/groups/v2/groups',
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label: planningCenterClient.getStringAttribute(r, 'name') ?? 'Untitled Group ' + r.id,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load options.' };
			}
		},
	}),
	groupEventDropdown: Property.Dropdown({
		displayName: 'Group Event',
		description: 'The group event for attendance.',
		auth: planningCenterAuth,
		refreshers: ['group'],
		required: true,
		options: async ({ auth, group }) => {
			if (!auth || !group) {
				return { disabled: true, options: [], placeholder: 'Select group first' };
			}
			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(auth.props);
				const resources = await planningCenterClient.paginatedApiCall({
					credentials,
					path: `/groups/v2/groups/${group}/events`,
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label: planningCenterClient.getStringAttribute(r, 'name') ?? 'Untitled Event ' + r.id,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load options.' };
			}
		},
	}),
};
