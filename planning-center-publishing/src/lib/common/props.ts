import { Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from './client';
import { resolveDateRangeFromPreset } from './dates';

type PlanningCenterFilterProps = {
	sort_direction?: string;
	start_date?: string;
	end_date?: string;
	page_size?: number;
};


type PlanningCenterListProps = PlanningCenterFilterProps & {
	date_filter?: string;
	timezone?: string;
	fetch_all_pages?: boolean;
	max_results?: number;
};

export function planningCenterListOptions({
	props,
	sortField,
	dateField,
}: {
	props: PlanningCenterListProps;
	sortField: string;
	dateField: string;
}) {
	const resolvedDates = resolveDateRangeFromPreset({
		preset: props.date_filter,
		timeZone: props.timezone,
		startDate: props.start_date,
		endDate: props.end_date,
	});
	const startDate = resolvedDates.startDate;
	const endDate = resolvedDates.endDate;

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
		resolvedDateLabel: resolvedDates.resolvedLabel,
	};
}

/**
 * Build query params from common filter props.
 */
export function buildFilterParams(
	props: PlanningCenterFilterProps,
	sortField: string = 'published_at',
	dateField: string = 'published_at',
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

	dateFilter: Property.StaticDropdown({
		displayName: 'Date Filter',
		description:
			'Quick date presets use your timezone. Choose Custom range for explicit start/end dates.',
		required: false,
		defaultValue: 'none',
		options: {
			options: [
				{ label: 'No date filter', value: 'none' },
				{ label: 'Today', value: 'today' },
				{
					label: 'Latest Sunday (today if Sunday, else previous Sunday)',
					value: 'latest_sunday',
				},
				{ label: 'Custom range', value: 'custom' },
			],
		},
	}),

	timeZone: Property.ShortText({
		displayName: 'Timezone',
		description:
			'IANA timezone for Today and Latest Sunday presets (e.g. America/Chicago, America/New_York).',
		required: false,
		defaultValue: 'America/Chicago',
	}),

	startDate: Property.DateTime({
		displayName: 'Start Date (Custom range only)',
		description:
			'Only used when Date Filter is "Custom range". Results on or after this date/time.',
		required: false,
	}),

	endDate: Property.DateTime({
		displayName: 'End Date (Custom range only)',
		description:
			'Only used when Date Filter is "Custom range". Results on or before this date/time.',
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
	streamType: Property.StaticDropdown({
		displayName: 'Stream Type',
		description: 'How the episode is streamed.',
		required: false,
		options: {
			options: [
				{
					label: 'Channel default livestream',
					value: 'channel_default_livestream',
				},
				{ label: 'Livestream', value: 'livestream' },
				{ label: 'Prerecorded', value: 'prerecorded' },
			],
		},
	}),

	episodeInclude: Property.StaticMultiSelectDropdown({
		displayName: 'Include Related Data',
		description:
			'Optional related resources to include in the response (episode_resources, speakerships, series).',
		required: false,
		options: {
			options: [
				{ label: 'Episode Resources', value: 'episode_resources' },
				{ label: 'Speakerships', value: 'speakerships' },
				{ label: 'Series', value: 'series' },
			],
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
