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
	personSearch: Property.ShortText({
		displayName: 'Search People',
		description: 'Optional. Filter people by name (e.g. Jane or jane@church.com).',
		required: false,
	}),
	personDropdown: Property.Dropdown({
		displayName: 'Person',
		description: 'The person to look up.',
		auth: planningCenterAuth,
		refreshers: ['person_search'],
		required: true,
		options: async ({ auth, person_search }) => {
			if (!auth) {
				return { disabled: true, options: [], placeholder: 'Connect your account first' };
			}
			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(auth.props);
				const queryParams: Record<string, string> = { per_page: '100', order: 'name' };
				if (typeof person_search === 'string' && person_search.length > 0) {
					queryParams['where[search_name]'] = person_search;
				}
				const resources = await planningCenterClient.paginatedApiCall({
					credentials,
					path: '/people/v2/people',
					queryParams,
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label: planningCenterClient.getStringAttribute(r, 'name') ?? `Person ${r.id}`,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load people.' };
			}
		},
	}),
	listDropdown: Property.Dropdown({
		displayName: 'List',
		description: 'The people list to query.',
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
					path: '/people/v2/lists',
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label: planningCenterClient.getStringAttribute(r, 'name') ?? 'Untitled List ' + r.id,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load options.' };
			}
		},
	}),
};
