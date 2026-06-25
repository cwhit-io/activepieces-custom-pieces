import { Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from './client';

function formatPlanLabel(resource: {
	id: string;
	attributes?: Record<string, unknown>;
}): string {
	const title =
		typeof resource.attributes?.['title'] === 'string'
			? resource.attributes['title']
			: 'Untitled Plan';
	const sortDate =
		typeof resource.attributes?.['sort_date'] === 'string'
			? resource.attributes['sort_date']
			: null;

	return sortDate ? `${title} (${sortDate})` : `${title} (${resource.id})`;
}

function formatPersonLabel(resource: {
	id: string;
	attributes?: Record<string, unknown>;
}): string {
	const name =
		typeof resource.attributes?.['name'] === 'string'
			? resource.attributes['name']
			: `Person ${resource.id}`;
	return name;
}

export const planningCenterCommon = {
	serviceTypeDropdown: Property.Dropdown({
		displayName: 'Service Type',
		description:
			'The service type that groups plans and teams (e.g. Sunday Morning, Youth Service).',
		auth: planningCenterAuth,
		refreshers: [],
		required: true,
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Connect your Planning Center account first',
				};
			}

			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(
					auth.props,
				);
				const resources = await planningCenterClient.paginatedApiCall({
					credentials,
					path: '/services/v2/service_types',
				});

				return {
					disabled: false,
					options: resources.map((resource) => ({
						label:
							planningCenterClient.getStringAttribute(resource, 'name') ??
							`Service Type ${resource.id}`,
						value: resource.id,
					})),
				};
			} catch {
				return {
					disabled: true,
					options: [],
					placeholder: 'Failed to load service types. Check your connection.',
				};
			}
		},
	}),

	planDropdown: Property.Dropdown({
		displayName: 'Plan',
		description:
			'The plan for a specific service date. Plans hold team assignments and service times.',
		auth: planningCenterAuth,
		refreshers: ['service_type'],
		required: true,
		options: async ({ auth, service_type }) => {
			if (!auth || !service_type) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Select a service type first',
				};
			}

			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(
					auth.props,
				);
				const resources = await planningCenterClient.paginatedApiCall({
					credentials,
					path: `/services/v2/service_types/${service_type}/plans`,
					queryParams: {
						order: 'sort_date',
					},
				});

				return {
					disabled: false,
					options: resources.map((resource) => ({
						label: formatPlanLabel(resource),
						value: resource.id,
					})),
				};
			} catch {
				return {
					disabled: true,
					options: [],
					placeholder: 'Failed to load plans. Check your connection.',
				};
			}
		},
	}),

	teamDropdown: Property.Dropdown({
		displayName: 'Team',
		description:
			'The team whose members can be scheduled (e.g. Band, Tech, Greeters).',
		auth: planningCenterAuth,
		refreshers: ['service_type'],
		required: true,
		options: async ({ auth, service_type }) => {
			if (!auth || !service_type) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Select a service type first',
				};
			}

			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(
					auth.props,
				);
				const resources = await planningCenterClient.paginatedApiCall({
					credentials,
					path: `/services/v2/service_types/${service_type}/teams`,
				});

				return {
					disabled: false,
					options: resources.map((resource) => ({
						label:
							planningCenterClient.getStringAttribute(resource, 'name') ??
							`Team ${resource.id}`,
						value: resource.id,
					})),
				};
			} catch {
				return {
					disabled: true,
					options: [],
					placeholder: 'Failed to load teams. Check your connection.',
				};
			}
		},
	}),

	personSearch: Property.ShortText({
		displayName: 'Search People',
		description:
			'Optional. Filter the person list by name (e.g. Jane or jane@church.com).',
		required: false,
	}),

	personDropdown: Property.Dropdown({
		displayName: 'Person',
		description:
			'The person to look up scheduling requests or blockouts for.',
		auth: planningCenterAuth,
		refreshers: ['person_search'],
		required: true,
		options: async ({ auth, person_search }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Connect your Planning Center account first',
				};
			}

			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(
					auth.props,
				);
				const queryParams: Record<string, string> = {
					per_page: '100',
					order: 'name',
				};

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
					options: resources.map((resource) => ({
						label: formatPersonLabel(resource),
						value: resource.id,
					})),
				};
			} catch {
				return {
					disabled: true,
					options: [],
					placeholder: 'Failed to load people. Check People API permissions.',
				};
			}
		},
	}),

	fetchAllPages: Property.Checkbox({
		displayName: 'Fetch All Pages',
		description:
			'When enabled, automatically fetches every page of results (up to API limits).',
		required: false,
		defaultValue: true,
	}),
};