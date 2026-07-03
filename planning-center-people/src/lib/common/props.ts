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
	dateField: string = 'created_at',
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
				const queryParams: Record<string, string> = { per_page: '100', order: 'last_name' };
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
	fieldDataDropdown: Property.Dropdown({
		displayName: 'Field Data',
		description: 'A custom field value record to update.',
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
					path: '/people/v2/field_data',
					queryParams: { per_page: '100', order: '-updated_at' },
				});
				return {
					disabled: false,
					options: resources.map((r) => {
						const value = planningCenterClient.getStringAttribute(r, 'value');
						const label = value
							? `Field Data ${r.id} (${value})`
							: `Field Data ${r.id}`;
						return { label, value: r.id };
					}),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load field data.' };
			}
		},
	}),
	formDropdown: Property.Dropdown({
		displayName: 'Form',
		description: 'The Planning Center form to query.',
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
					path: '/people/v2/forms',
					queryParams: { per_page: '100', order: 'name' },
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label: planningCenterClient.getStringAttribute(r, 'name') ?? `Form ${r.id}`,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load forms.' };
			}
		},
	}),
	householdDropdown: Property.Dropdown({
		displayName: 'Household',
		description: 'The household to update.',
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
					path: '/people/v2/households',
					queryParams: { per_page: '100', order: 'name' },
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label: planningCenterClient.getStringAttribute(r, 'name') ?? `Household ${r.id}`,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load households.' };
			}
		},
	}),
	noteCategoryDropdown: Property.Dropdown({
		displayName: 'Note Category',
		description: 'Optional. The category for the note.',
		auth: planningCenterAuth,
		refreshers: [],
		required: false,
		options: async ({ auth }) => {
			if (!auth) {
				return { disabled: true, options: [], placeholder: 'Connect your account first' };
			}
			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(auth.props);
				const resources = await planningCenterClient.paginatedApiCall({
					credentials,
					path: '/people/v2/note_categories',
					queryParams: { per_page: '100', order: 'name' },
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label: planningCenterClient.getStringAttribute(r, 'name') ?? `Category ${r.id}`,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load note categories.' };
			}
		},
	}),
	contactLocation: Property.StaticDropdown({
		displayName: 'Location',
		description: 'Where this contact info is used (e.g. Home, Work).',
		required: false,
		options: {
			options: [
				{ label: 'Home', value: 'Home' },
				{ label: 'Work', value: 'Work' },
				{ label: 'Mobile', value: 'Mobile' },
				{ label: 'Mailing', value: 'Mailing' },
				{ label: 'Other', value: 'Other' },
			],
		},
	}),
};
