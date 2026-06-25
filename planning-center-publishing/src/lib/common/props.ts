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
	channelDropdown: Property.Dropdown({
		displayName: 'Channel',
		description: 'The publishing channel.',
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
					path: '/publishing/v2/channels',
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label: planningCenterClient.getStringAttribute(r, 'name') ?? 'Untitled Channel ' + r.id,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load options.' };
			}
		},
	}),
	seriesDropdown: Property.Dropdown({
		displayName: 'Series',
		description: 'The sermon series.',
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
					path: '/publishing/v2/series',
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label: planningCenterClient.getStringAttribute(r, 'title') ?? 'Untitled Series ' + r.id,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load options.' };
			}
		},
	}),
	episodeDropdown: Property.Dropdown({
		displayName: 'Episode',
		description: 'The sermon episode.',
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
					path: '/publishing/v2/episodes',
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label: planningCenterClient.getStringAttribute(r, 'title') ?? 'Untitled Episode ' + r.id,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load options.' };
			}
		},
	}),
	speakerDropdown: Property.Dropdown({
		displayName: 'Speaker',
		description: 'The speaker.',
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
					path: '/publishing/v2/speakers',
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label: planningCenterClient.getStringAttribute(r, 'name') ?? 'Untitled Speaker ' + r.id,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load options.' };
			}
		},
	}),
};
