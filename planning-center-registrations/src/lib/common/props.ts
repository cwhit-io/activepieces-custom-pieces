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
	registrationEventDropdown: Property.Dropdown({
		displayName: 'Registration Event',
		description: 'The registration event.',
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
					path: '/registrations/v2/events',
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
	formDropdown: Property.Dropdown({
		displayName: 'Form',
		description: 'The registration form.',
		auth: planningCenterAuth,
		refreshers: ['registration_event'],
		required: true,
		options: async ({ auth, registration_event }) => {
			if (!auth || !registration_event) {
				return { disabled: true, options: [], placeholder: 'Select registration event first' };
			}
			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(auth.props);
				const resources = await planningCenterClient.paginatedApiCall({
					credentials,
					path: `/registrations/v2/events/${registration_event}/forms`,
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label: planningCenterClient.getStringAttribute(r, 'name') ?? 'Untitled Form ' + r.id,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load options.' };
			}
		},
	}),
	registrationDropdown: Property.Dropdown({
		displayName: 'Registration',
		description: 'The registration record.',
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
					path: '/registrations/v2/registrations',
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label: planningCenterClient.getStringAttribute(r, 'id') ?? 'Registration ' + r.id,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load options.' };
			}
		},
	}),
};
