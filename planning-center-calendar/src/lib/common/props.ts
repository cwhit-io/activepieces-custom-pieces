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

	calendarEventDropdown: Property.Dropdown({
		displayName: 'Calendar Event',
		description: 'The calendar event.',
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
					path: '/calendar/v2/events',
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label:
							planningCenterClient.getStringAttribute(r, 'name') ??
							planningCenterClient.getStringAttribute(r, 'title') ??
							'Untitled Event ' + r.id,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load options.' };
			}
		},
	}),

	calendarEventInstanceDropdown: Property.Dropdown({
		displayName: 'Event Instance',
		description: 'A specific occurrence of a calendar event.',
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
					path: '/calendar/v2/event_instances',
					queryParams: { order: '-starts_at' },
				});
				return {
					disabled: false,
					options: resources.map((r) => {
						const startsAt =
							planningCenterClient.getStringAttribute(r, 'starts_at') ?? '';
						const name =
							planningCenterClient.getStringAttribute(r, 'name') ??
							planningCenterClient.getStringAttribute(r, 'event_name');
						const label = name
							? `${name} (${startsAt || r.id})`
							: `Event Instance ${r.id}`;
						return { label, value: r.id };
					}),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load options.' };
			}
		},
	}),

	calendarResourceDropdown: Property.Dropdown({
		displayName: 'Resource',
		description: 'A room or reservable resource.',
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
					path: '/calendar/v2/resources',
					queryParams: { order: 'name' },
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label:
							planningCenterClient.getStringAttribute(r, 'name') ??
							'Resource ' + r.id,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load options.' };
			}
		},
	}),

	eventResourceRequestDropdown: Property.Dropdown({
		displayName: 'Event Resource Request',
		description: 'A pending or approved resource request for an event.',
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
					path: '/calendar/v2/event_resource_requests',
					queryParams: { order: '-created_at' },
				});
				return {
					disabled: false,
					options: resources.map((r) => {
						const createdAt =
							planningCenterClient.getStringAttribute(r, 'created_at') ?? '';
						const status =
							planningCenterClient.getStringAttribute(r, 'approval_status') ?? '';
						const label = status
							? `Request ${r.id} (${status}${createdAt ? ', ' + createdAt : ''})`
							: `Request ${r.id}`;
						return { label, value: r.id };
					}),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load options.' };
			}
		},
	}),

	tagDropdown: Property.Dropdown({
		displayName: 'Tag',
		description: 'A calendar tag used to categorize events.',
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
					path: '/calendar/v2/tags',
					queryParams: { order: 'name' },
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label:
							planningCenterClient.getStringAttribute(r, 'name') ??
							'Tag ' + r.id,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load options.' };
			}
		},
	}),

	tagGroupDropdown: Property.Dropdown({
		displayName: 'Tag Group',
		description: 'Optional parent tag group for a new tag.',
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
					path: '/calendar/v2/tag_groups',
					queryParams: { order: 'name' },
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label:
							planningCenterClient.getStringAttribute(r, 'name') ??
							'Tag Group ' + r.id,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load options.' };
			}
		},
	}),

	resourceFolderDropdown: Property.Dropdown({
		displayName: 'Resource Folder',
		description: 'Optional parent folder for a resource or folder.',
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
					path: '/calendar/v2/resource_folders',
					queryParams: { order: 'name' },
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label:
							planningCenterClient.getStringAttribute(r, 'name') ??
							'Folder ' + r.id,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load options.' };
			}
		},
	}),

	resourceKind: Property.StaticDropdown({
		displayName: 'Kind',
		description: 'Whether this is a room or general resource/equipment.',
		required: true,
		options: {
			options: [
				{ label: 'Room', value: 'Room' },
				{ label: 'Resource', value: 'Resource' },
			],
		},
	}),
};
