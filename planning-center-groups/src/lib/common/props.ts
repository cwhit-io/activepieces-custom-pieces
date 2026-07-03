import { Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';

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
 */
export function buildFilterParams(
	props: PlanningCenterFilterProps,
	sortField: string = 'name',
	dateField: string = 'starts_at',
): Record<string, string> {
	const params: Record<string, string> = {};

	const sortDirection = props.sort_direction;
	if (sortDirection === 'desc') {
		params['order'] = `-${sortField}`;
	} else if (sortDirection === 'asc') {
		params['order'] = sortField;
	}

	const startDate = props.start_date;
	const endDate = props.end_date;

	if (startDate) {
		params[`where[${dateField}][gte]`] = startDate;
	}
	if (endDate) {
		params[`where[${dateField}][lte]`] = endDate;
	}

	const pageSize = props.page_size;
	if (pageSize && pageSize > 0) {
		params['per_page'] = String(pageSize);
	}

	return params;
}

export const planningCenterCommon = {
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
			'Optional. Only return results on or after this date/time (ISO 8601).',
		required: false,
	}),

	endDate: Property.DateTime({
		displayName: 'End Date (To)',
		description:
			'Optional. Only return results on or before this date/time (ISO 8601).',
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
	eventDropdown: Property.Dropdown({
		displayName: 'Event',
		description: 'A group event (org-wide).',
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
					path: '/groups/v2/events',
					queryParams: { order: '-starts_at' },
				});
				return {
					disabled: false,
					options: resources.map((r) => {
						const name =
							planningCenterClient.getStringAttribute(r, 'name') ??
							'Untitled Event ' + r.id;
						const startsAt = planningCenterClient.getStringAttribute(r, 'starts_at');
						return {
							label: startsAt ? `${name} (${startsAt})` : name,
							value: r.id,
						};
					}),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load options.' };
			}
		},
	}),
	personSearch: Property.ShortText({
		displayName: 'Search People',
		description: 'Optional. Filter people by name (e.g. Jane or jane@church.com).',
		required: false,
	}),
	personDropdown: Property.Dropdown({
		displayName: 'Person',
		description: 'The person to add to the group.',
		auth: planningCenterAuth,
		refreshers: ['person_search'],
		required: true,
		options: async ({ auth, person_search }) => {
			if (!auth) {
				return { disabled: true, options: [], placeholder: 'Connect your account first' };
			}
			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(auth.props);
				const queryParams: Record<string, string> = {
					per_page: '100',
					order: 'last_name',
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
					options: resources.map((r) => ({
						label:
							planningCenterClient.getStringAttribute(r, 'name') ??
							`Person ${r.id}`,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load people.' };
			}
		},
	}),
	membershipDropdown: Property.Dropdown({
		displayName: 'Membership',
		description: 'The group membership to update or remove.',
		auth: planningCenterAuth,
		refreshers: ['group'],
		required: true,
		options: async ({ auth, group }) => {
			if (!auth || !group) {
				return { disabled: true, options: [], placeholder: 'Select group first' };
			}
			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(auth.props);
				const response = await planningCenterClient.paginatedJsonApiListResponse({
					credentials,
					path: `/groups/v2/groups/${group}/memberships`,
					queryParams: { include: 'person' },
				});
				const resources = response.data ?? [];
				const included = response.included ?? [];
				const personNames = new Map<string, string>();
				for (const resource of included) {
					if (resource.type === 'Person') {
						const name = planningCenterClient.getStringAttribute(resource, 'name');
						if (name) {
							personNames.set(resource.id, name);
						}
					}
				}
				return {
					disabled: false,
					options: resources.map((r) => {
						const personData = r.relationships?.['person']?.data;
						const personId =
							personData &&
							!Array.isArray(personData) &&
							typeof personData.id === 'string'
								? personData.id
								: undefined;
						const personName =
							typeof personId === 'string'
								? personNames.get(personId)
								: undefined;
						const role = planningCenterClient.getStringAttribute(r, 'role');
						const labelParts = [personName, role, r.id].filter(
							(part): part is string =>
								typeof part === 'string' && part.length > 0,
						);
						return {
							label: labelParts.join(' · ') || `Membership ${r.id}`,
							value: r.id,
						};
					}),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load memberships.' };
			}
		},
	}),
	groupApplicationDropdown: Property.Dropdown({
		displayName: 'Group Application',
		description: 'A request to join a group.',
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
					path: '/groups/v2/group_applications',
					queryParams: { order: '-applied_at' },
				});
				return {
					disabled: false,
					options: resources.map((r) => {
						const status = planningCenterClient.getStringAttribute(r, 'status');
						const appliedAt = planningCenterClient.getStringAttribute(r, 'applied_at');
						const labelParts = [status, appliedAt, r.id].filter(
							(part): part is string =>
								typeof part === 'string' && part.length > 0,
						);
						return {
							label: labelParts.join(' · ') || `Application ${r.id}`,
							value: r.id,
						};
					}),
				};
			} catch {
				return {
					disabled: true,
					options: [],
					placeholder: 'Failed to load applications.',
				};
			}
		},
	}),
};
