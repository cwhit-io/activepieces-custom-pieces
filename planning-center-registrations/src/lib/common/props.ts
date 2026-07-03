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
	sortField: string = 'starts_at',
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

	registrationEventDropdown: Property.Dropdown({
		displayName: 'Signup',
		description: 'The registration signup (Registrations API signups resource).',
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
					path: '/registrations/v2/signups',
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label: planningCenterClient.getStringAttribute(r, 'name') ?? 'Untitled Signup ' + r.id,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load options.' };
			}
		},
	}),
	selectionTypeDropdown: Property.Dropdown({
		displayName: 'Selection Type',
		description: 'The registration selection type for a signup.',
		auth: planningCenterAuth,
		refreshers: ['registration_event'],
		required: true,
		options: async ({ auth, registration_event }) => {
			if (!auth || !registration_event) {
				return { disabled: true, options: [], placeholder: 'Select signup first' };
			}
			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(auth.props);
				const resources = await planningCenterClient.paginatedApiCall({
					credentials,
					path: `/registrations/v2/signups/${registration_event}/selection_types`,
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label: planningCenterClient.getStringAttribute(r, 'name') ?? 'Untitled Selection Type ' + r.id,
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
	optionalRegistrationDropdown: Property.Dropdown({
		displayName: 'Registration',
		description: 'Optional. Filter attendees to a specific registration.',
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
	attendeeDropdown: Property.Dropdown({
		displayName: 'Attendee',
		description: 'The attendee record.',
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
					path: '/registrations/v2/attendees',
					queryParams: { order: '-created_at', per_page: '100' },
					maxResults: 500,
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label:
							planningCenterClient.getStringAttribute(r, 'name') ??
							'Attendee ' + r.id,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load options.' };
			}
		},
	}),
	attendeeInclude: Property.StaticMultiSelectDropdown({
		displayName: 'Include Related Resources',
		description:
			'Optional. Related resources to include with the attendee response.',
		required: false,
		options: {
			options: [
				{ label: 'Emergency Contact', value: 'emergency_contact' },
				{ label: 'Person', value: 'person' },
				{ label: 'Registration', value: 'registration' },
				{ label: 'Registration Created By', value: 'registration.created_by' },
				{
					label: 'Registration Registrant Contact',
					value: 'registration.registrant_contact',
				},
				{ label: 'Selection Type', value: 'selection_type' },
			],
		},
	}),
	signupInclude: Property.StaticMultiSelectDropdown({
		displayName: 'Include Related Resources',
		description: 'Optional. Related resources to include with the signup response.',
		required: false,
		options: {
			options: [
				{ label: 'Campuses', value: 'campuses' },
				{ label: 'Categories', value: 'categories' },
				{ label: 'Next Signup Time', value: 'next_signup_time' },
				{ label: 'Selection Types', value: 'selection_types' },
				{ label: 'Signup Location', value: 'signup_location' },
				{ label: 'Signup Times', value: 'signup_times' },
			],
		},
	}),
	registrationInclude: Property.StaticMultiSelectDropdown({
		displayName: 'Include Related Resources',
		description:
			'Optional. Related resources to include with the registration response.',
		required: false,
		options: {
			options: [
				{ label: 'Created By', value: 'created_by' },
				{ label: 'Registrant Contact', value: 'registrant_contact' },
			],
		},
	}),
};

export function buildIncludeQueryParam(
	include?: string | string[],
): Record<string, string> {
	if (!include || (Array.isArray(include) && include.length === 0)) {
		return {};
	}
	const value = Array.isArray(include) ? include.join(',') : include;
	return { include: value };
}
