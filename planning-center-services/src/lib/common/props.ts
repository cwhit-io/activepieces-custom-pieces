import { Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from './client';

type PlanningCenterFilterProps = {
	sort_direction?: string;
	start_date?: string;
	end_date?: string;
	page_size?: number;
};


type PlanningCenterListProps = PlanningCenterFilterProps & {
	fetch_all_pages?: boolean;
	max_results?: number;
};

function normalizePcoDate({
	value,
	bound,
}: {
	value: string;
	bound: 'start' | 'end';
}): string {
	const trimmed = value.trim();
	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
		return bound === 'start'
			? `${trimmed}T00:00:00Z`
			: `${trimmed}T23:59:59.999Z`;
	}
	if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(trimmed)) {
		return `${trimmed}Z`;
	}
	return trimmed;
}

export function planningCenterListOptions({
	props,
	sortField,
	dateField,
}: {
	props: PlanningCenterListProps;
	sortField: string;
	dateField: string;
}) {
	const startDate = props.start_date
		? normalizePcoDate({ value: props.start_date, bound: 'start' })
		: undefined;
	const endDate = props.end_date
		? normalizePcoDate({ value: props.end_date, bound: 'end' })
		: undefined;

	return {
		queryParams: buildFilterParams(
			{
				...props,
				start_date: startDate,
				end_date: endDate,
			},
			sortField,
			dateField,
		),
		clientFilters: {
			dateField,
			startDate,
			endDate,
			sortField,
			sortDirection: props.sort_direction,
		},
		fetchAll: props.fetch_all_pages ?? true,
		maxResults: props.max_results ? Number(props.max_results) : undefined,
	};
}

/**
 * Build query params from common filter props.
 * Each action calls this to merge filters into its API request params.
 */
export function buildFilterParams(
	props: PlanningCenterFilterProps,
	sortField: string = 'sort_date',
	dateField: string = 'sort_date',
): Record<string, string> {
	const params: Record<string, string> = {};

	// Sort direction
	const sortDirection = props.sort_direction;
	if (sortDirection === 'desc') {
		params['order'] = `-${sortField}`;
	} else if (sortDirection === 'asc') {
		params['order'] = sortField;
	}

	// Date range filters
	const startDate = props.start_date;
	const endDate = props.end_date;

	if (startDate) {
		params[`where[${dateField}][gte]`] = startDate;
	}
	if (endDate) {
		params[`where[${dateField}][lte]`] = endDate;
	}

	// Page size
	const pageSize = props.page_size;
	if (pageSize && pageSize > 0) {
		params['per_page'] = String(pageSize);
	}

	return params;
}

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

function formatScheduleLabel(resource: {
	id: string;
	attributes?: Record<string, unknown>;
}): string {
	const dates =
		typeof resource.attributes?.['dates'] === 'string'
			? resource.attributes['dates']
			: null;
	const position =
		typeof resource.attributes?.['team_position_name'] === 'string'
			? resource.attributes['team_position_name']
			: null;
	const status =
		typeof resource.attributes?.['status'] === 'string'
			? resource.attributes['status']
			: null;
	const parts = [dates, position, status].filter(Boolean);
	return parts.length > 0 ? parts.join(' — ') : `Schedule ${resource.id}`;
}

function formatPlanPersonLabel(resource: {
	id: string;
	attributes?: Record<string, unknown>;
}): string {
	const name =
		typeof resource.attributes?.['name'] === 'string'
			? resource.attributes['name']
			: null;
	const position =
		typeof resource.attributes?.['team_position_name'] === 'string'
			? resource.attributes['team_position_name']
			: null;
	const status =
		typeof resource.attributes?.['status'] === 'string'
			? resource.attributes['status']
			: null;
	const parts = [name, position, status].filter(Boolean);
	return parts.length > 0 ? parts.join(' — ') : `Plan Person ${resource.id}`;
}

function formatNeededPositionLabel(resource: {
	id: string;
	attributes?: Record<string, unknown>;
}): string {
	const position =
		typeof resource.attributes?.['team_position_name'] === 'string'
			? resource.attributes['team_position_name']
			: 'Position';
	const quantity =
		typeof resource.attributes?.['quantity'] === 'number'
			? resource.attributes['quantity']
			: null;
	return quantity !== null
		? `${position} (qty: ${quantity})`
		: `${position} (${resource.id})`;
}

function formatPlanTimeLabel(resource: {
	id: string;
	attributes?: Record<string, unknown>;
}): string {
	const name =
		typeof resource.attributes?.['name'] === 'string'
			? resource.attributes['name']
			: 'Time';
	const startsAt =
		typeof resource.attributes?.['starts_at'] === 'string'
			? resource.attributes['starts_at']
			: null;
	return startsAt ? `${name} (${startsAt})` : `${name} (${resource.id})`;
}

function formatPlanItemLabel(resource: {
	id: string;
	attributes?: Record<string, unknown>;
}): string {
	const title =
		typeof resource.attributes?.['title'] === 'string'
			? resource.attributes['title']
			: null;
	const description =
		typeof resource.attributes?.['description'] === 'string'
			? resource.attributes['description']
			: null;
	const itemType =
		typeof resource.attributes?.['item_type'] === 'string'
			? resource.attributes['item_type']
			: null;
	const label = title ?? description ?? `Item ${resource.id}`;
	return itemType ? `${label} [${itemType}]` : label;
}

function formatSongLabel(resource: {
	id: string;
	attributes?: Record<string, unknown>;
}): string {
	const title =
		typeof resource.attributes?.['title'] === 'string'
			? resource.attributes['title']
			: `Song ${resource.id}`;
	const author =
		typeof resource.attributes?.['author'] === 'string'
			? resource.attributes['author']
			: null;
	return author ? `${title} — ${author}` : title;
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

	teamDropdownOptional: Property.Dropdown({
		displayName: 'Team Filter',
		description:
			'Optional. Limit results to one team (e.g. Band, Tech). Leave empty to return all teams on the plan.',
		auth: planningCenterAuth,
		refreshers: ['service_type'],
		required: false,
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

	personDropdownOptional: Property.Dropdown({
		displayName: 'Person',
		description:
			'Optional. Select a person when the action requires one.',
		auth: planningCenterAuth,
		refreshers: ['person_search'],
		required: false,
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
					order: 'last_name',
				};

				if (typeof person_search === 'string' && person_search.length > 0) {
					queryParams['where[name_like]'] = person_search;
				}

				const resources = await planningCenterClient.paginatedApiCall({
					credentials,
					path: '/services/v2/people',
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
					placeholder: 'Failed to load people. Check Services API permissions.',
				};
			}
		},
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
					order: 'last_name',
				};

				if (typeof person_search === 'string' && person_search.length > 0) {
					queryParams['where[name_like]'] = person_search;
				}

				const resources = await planningCenterClient.paginatedApiCall({
					credentials,
					path: '/services/v2/people',
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
					placeholder: 'Failed to load people. Check Services API permissions.',
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

	// ── Common filter props ─────────────────────────────────────────

	sortDirection: Property.StaticDropdown({
		displayName: 'Sort Direction',
		description:
			'Sort order for results. Defaults to oldest first if not set.',
		required: false,
		options: {
			options: [
				{ label: 'Oldest First (Ascending)', value: 'asc' },
				{ label: 'Newest First (Descending)', value: 'desc' },
			],
		},
	}),

	startDate: Property.DateTime({
		displayName: 'Start Date (From)',
		description:
			'Optional. Only return results on or after this date/time (ISO 8601, e.g. 2026-06-25 or 2026-06-25T00:00:00Z).',
		required: false,
	}),

	endDate: Property.DateTime({
		displayName: 'End Date (To)',
		description:
			'Optional. Only return results on or before this date/time (ISO 8601, e.g. 2026-06-25 or 2026-06-25T23:59:59Z).',
		required: false,
	}),

	pageSize: Property.Number({
		displayName: 'Page Size',
		description:
			'Optional. Number of results per page (max 100). Defaults to 100.',
		required: false,
		defaultValue: 100,
	}),

	maxResults: Property.Number({
		displayName: 'Max Results',
		description:
			'Optional. Maximum total results to return. Stops fetching once reached. Leave empty for no limit.',
		required: false,
	}),

	scheduleDropdown: Property.Dropdown({
		displayName: 'Schedule',
		description:
			'A scheduling request for the selected person (pending, accepted, or declined).',
		auth: planningCenterAuth,
		refreshers: ['person_search', 'person'],
		required: true,
		options: async ({ auth, person }) => {
			if (!auth || !person) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Select a person first',
				};
			}

			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(
					auth.props,
				);
				const resources = await planningCenterClient.paginatedApiCall({
					credentials,
					path: `/services/v2/people/${person}/schedules`,
				});

				return {
					disabled: false,
					options: resources.map((resource) => ({
						label: formatScheduleLabel(resource),
						value: resource.id,
					})),
				};
			} catch {
				return {
					disabled: true,
					options: [],
					placeholder: 'Failed to load schedules. Check your connection.',
				};
			}
		},
	}),

	personPlanPersonDropdown: Property.Dropdown({
		displayName: 'Plan Person',
		description:
			'A plan assignment for the selected person (their scheduled services).',
		auth: planningCenterAuth,
		refreshers: ['person_search', 'person'],
		required: true,
		options: async ({ auth, person }) => {
			if (!auth || !person) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Select a person first',
				};
			}

			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(
					auth.props,
				);
				const resources = await planningCenterClient.paginatedApiCall({
					credentials,
					path: `/services/v2/people/${person}/plan_people`,
				});

				return {
					disabled: false,
					options: resources.map((resource) => ({
						label: formatPlanPersonLabel(resource),
						value: resource.id,
					})),
				};
			} catch {
				return {
					disabled: true,
					options: [],
					placeholder: 'Failed to load plan people. Check your connection.',
				};
			}
		},
	}),

	planTeamMemberDropdown: Property.Dropdown({
		displayName: 'Plan Team Member',
		description:
			'A person scheduled on the selected plan (use to update or remove assignments).',
		auth: planningCenterAuth,
		refreshers: ['service_type', 'plan'],
		required: true,
		options: async ({ auth, service_type, plan }) => {
			if (!auth || !service_type || !plan) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Select a service type and plan first',
				};
			}

			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(
					auth.props,
				);
				const resources = await planningCenterClient.paginatedApiCall({
					credentials,
					path: `/services/v2/service_types/${service_type}/plans/${plan}/team_members`,
				});

				return {
					disabled: false,
					options: resources.map((resource) => ({
						label: formatPlanPersonLabel(resource),
						value: resource.id,
					})),
				};
			} catch {
				return {
					disabled: true,
					options: [],
					placeholder: 'Failed to load plan team members.',
				};
			}
		},
	}),

	neededPositionDropdown: Property.Dropdown({
		displayName: 'Needed Position',
		description: 'An open volunteer slot on the selected plan.',
		auth: planningCenterAuth,
		refreshers: ['service_type', 'plan'],
		required: true,
		options: async ({ auth, service_type, plan }) => {
			if (!auth || !service_type || !plan) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Select a service type and plan first',
				};
			}

			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(
					auth.props,
				);
				const resources = await planningCenterClient.paginatedApiCall({
					credentials,
					path: `/services/v2/service_types/${service_type}/plans/${plan}/needed_positions`,
				});

				return {
					disabled: false,
					options: resources.map((resource) => ({
						label: formatNeededPositionLabel(resource),
						value: resource.id,
					})),
				};
			} catch {
				return {
					disabled: true,
					options: [],
					placeholder: 'Failed to load needed positions.',
				};
			}
		},
	}),

	planTimeDropdown: Property.Dropdown({
		displayName: 'Plan Time',
		description:
			'A service or rehearsal time on the selected plan (e.g. 9:00 AM service).',
		auth: planningCenterAuth,
		refreshers: ['service_type', 'plan'],
		required: false,
		options: async ({ auth, service_type, plan }) => {
			if (!auth || !service_type || !plan) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Select a service type and plan first',
				};
			}

			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(
					auth.props,
				);
				const resources = await planningCenterClient.paginatedApiCall({
					credentials,
					path: `/services/v2/service_types/${service_type}/plans/${plan}/plan_times`,
				});

				return {
					disabled: false,
					options: resources.map((resource) => ({
						label: formatPlanTimeLabel(resource),
						value: resource.id,
					})),
				};
			} catch {
				return {
					disabled: true,
					options: [],
					placeholder: 'Failed to load plan times.',
				};
			}
		},
	}),

	teamPositionDropdown: Property.Dropdown({
		displayName: 'Team Position',
		description: 'A role/position within the selected team.',
		auth: planningCenterAuth,
		refreshers: ['service_type', 'team'],
		required: false,
		options: async ({ auth, team }) => {
			if (!auth || !team) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Select a team first',
				};
			}

			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(
					auth.props,
				);
				const resources = await planningCenterClient.paginatedApiCall({
					credentials,
					path: `/services/v2/teams/${team}/team_positions`,
				});

				return {
					disabled: false,
					options: resources.map((resource) => ({
						label:
							planningCenterClient.getStringAttribute(resource, 'name') ??
							`Position ${resource.id}`,
						value: resource.id,
					})),
				};
			} catch {
				return {
					disabled: true,
					options: [],
					placeholder: 'Failed to load team positions.',
				};
			}
		},
	}),

	planItemDropdown: Property.Dropdown({
		displayName: 'Plan Item',
		description:
			'A song, header, or media item on the selected plan setlist.',
		auth: planningCenterAuth,
		refreshers: ['service_type', 'plan'],
		required: true,
		options: async ({ auth, service_type, plan }) => {
			if (!auth || !service_type || !plan) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Select a service type and plan first',
				};
			}

			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(
					auth.props,
				);
				const resources = await planningCenterClient.paginatedApiCall({
					credentials,
					path: `/services/v2/service_types/${service_type}/plans/${plan}/items`,
				});

				return {
					disabled: false,
					options: resources.map((resource) => ({
						label: formatPlanItemLabel(resource),
						value: resource.id,
					})),
				};
			} catch {
				return {
					disabled: true,
					options: [],
					placeholder: 'Failed to load plan items.',
				};
			}
		},
	}),

	songDropdown: Property.Dropdown({
		displayName: 'Song',
		description: 'A song from your Planning Center Services song library.',
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
					path: '/services/v2/songs',
					queryParams: {
						order: 'title',
					},
				});

				return {
					disabled: false,
					options: resources.map((resource) => ({
						label: formatSongLabel(resource),
						value: resource.id,
					})),
				};
			} catch {
				return {
					disabled: true,
					options: [],
					placeholder: 'Failed to load songs. Check your connection.',
				};
			}
		},
	}),
};