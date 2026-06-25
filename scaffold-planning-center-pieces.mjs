import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('.', import.meta.url).pathname;
const ESLINT = `{
  "extends": ["../../../../.eslintrc.base.json"],
  "ignorePatterns": ["!**/*"],
  "overrides": [
    { "files": ["*.ts", "*.tsx", "*.js", "*.jsx"], "rules": {} },
    {
      "files": ["*.ts", "*.tsx"],
      "rules": {
        "no-restricted-imports": [
          "error",
          {
            "patterns": [
              "lodash",
              "lodash/*",
              "@activepieces/core-*",
              "@activepieces/server*",
              "@activepieces/engine",
              "@activepieces/shared"
            ]
          }
        ]
      }
    },
    { "files": ["*.js", "*.jsx"], "rules": {} }
  ]
}`;

const TSCONFIG = `{
  "extends": "../../../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "files": [],
  "include": [],
  "references": [{ "path": "./tsconfig.lib.json" }]
}`;

const TSCONFIG_LIB = `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {},
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "types": ["node"]
  },
  "exclude": ["jest.config.ts", "src/**/*.spec.ts", "src/**/*.test.ts"],
  "include": ["src/**/*.ts"]
}`;

const CLIENT_TEMPLATE = (userAgent) => `import {
	AuthenticationType,
	httpClient,
	HttpMessageBody,
	HttpMethod,
	HttpResponse,
	QueryParams,
} from '@activepieces/pieces-common';

const BASE_URL = 'https://api.planningcenteronline.com';
const USER_AGENT = '${userAgent}';
const DEFAULT_PER_PAGE = 100;

function flattenValue(value: unknown, prefix: string): Record<string, unknown> {
	if (value === null || value === undefined) {
		return { [prefix]: null };
	}
	if (Array.isArray(value)) {
		const parts = value.map((item) => {
			if (typeof item === 'object' && item !== null) {
				return JSON.stringify(item);
			}
			return String(item);
		});
		return { [prefix]: parts.join(', ') };
	}
	if (typeof value === 'object') {
		return flattenObject(value as Record<string, unknown>, prefix);
	}
	return { [prefix]: value };
}

function flattenObject(
	obj: Record<string, unknown>,
	prefix = '',
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(obj)) {
		const flatKey = prefix ? \`\${prefix}_\${key}\` : key;
		Object.assign(result, flattenValue(value, flatKey));
	}
	return result;
}

function flattenJsonApiResource(
	resource: JsonApiResource,
): Record<string, unknown> {
	const flattened = flattenObject(resource.attributes ?? {}, '');
	return { id: resource.id, type: resource.type, ...flattened };
}

function flattenJsonApiCollection(
	resources: JsonApiResource[],
): Record<string, unknown>[] {
	return resources.map((resource) => flattenJsonApiResource(resource));
}

function getStringAttribute(
	resource: JsonApiResource,
	attributeName: string,
): string | null {
	const value = resource.attributes?.[attributeName];
	return typeof value === 'string' ? value : null;
}

async function apiCall<T extends HttpMessageBody>({
	credentials,
	method,
	path,
	body,
	queryParams,
}: {
	credentials: PlanningCenterCredentials;
	method: HttpMethod;
	path: string;
	body?: unknown;
	queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
	const query: QueryParams = {};
	if (queryParams) {
		for (const [key, value] of Object.entries(queryParams)) {
			query[key] = value;
		}
	}
	return await httpClient.sendRequest<T>({
		method,
		url: \`\${BASE_URL}\${path}\`,
		authentication: {
			type: AuthenticationType.BASIC,
			username: credentials.applicationId,
			password: credentials.secret,
		},
		headers: {
			'User-Agent': USER_AGENT,
			'Content-Type': 'application/json',
		},
		queryParams: query,
		body,
	});
}

async function paginatedApiCall({
	credentials,
	path,
	queryParams,
}: {
	credentials: PlanningCenterCredentials;
	path: string;
	queryParams?: Record<string, string>;
}): Promise<JsonApiResource[]> {
	const resources: JsonApiResource[] = [];
	let offset = 0;
	let hasMore = true;
	while (hasMore) {
		const response = await apiCall<JsonApiListResponse>({
			credentials,
			method: HttpMethod.GET,
			path,
			queryParams: {
				...queryParams,
				per_page: String(DEFAULT_PER_PAGE),
				offset: String(offset),
			},
		});
		const pageResources = response.body.data ?? [];
		resources.push(...pageResources);
		const totalCount = response.body.meta?.total_count;
		if (typeof totalCount === 'number') {
			offset += pageResources.length;
			hasMore = offset < totalCount;
			continue;
		}
		hasMore = Boolean(response.body.links?.next) && pageResources.length > 0;
		offset += pageResources.length;
	}
	return resources;
}

async function listResources({
	credentials,
	path,
	queryParams,
	fetchAll,
}: {
	credentials: PlanningCenterCredentials;
	path: string;
	queryParams?: Record<string, string>;
	fetchAll: boolean;
}): Promise<Record<string, unknown>[]> {
	const resources = fetchAll
		? await paginatedApiCall({ credentials, path, queryParams })
		: (
				await apiCall<JsonApiListResponse>({
					credentials,
					method: HttpMethod.GET,
					path,
					queryParams,
				})
			).body.data ?? [];
	return flattenJsonApiCollection(resources);
}

function credentialsFromAuthProps(
	props: Record<string, unknown>,
): PlanningCenterCredentials {
	const applicationId = props['application_id'];
	const secret = props['secret'];
	if (typeof applicationId !== 'string' || typeof secret !== 'string') {
		throw new Error('Missing Planning Center credentials on the connection.');
	}
	return { applicationId, secret };
}

export const planningCenterClient = {
	apiCall,
	paginatedApiCall,
	listResources,
	flattenJsonApiResource,
	flattenJsonApiCollection,
	getStringAttribute,
	credentialsFromAuthProps,
	BASE_URL,
};

export type PlanningCenterCredentials = {
	applicationId: string;
	secret: string;
};

type JsonApiResource = {
	type: string;
	id: string;
	attributes?: Record<string, unknown>;
};

type JsonApiListResponse = {
	data?: JsonApiResource[];
	links?: { next?: string };
	meta?: { total_count?: number };
};
`;

function logoUrl(color, icon) {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${color}"/>${icon}</svg>`;
	return `data:image/svg+xml,\${encodeURIComponent('${svg.replace(/'/g, "\\'")}')}`;
}

const PIECES = [
	{
		folder: 'planning-center-people',
		packageName: '@activepieces/piece-planning-center-people',
		exportName: 'planningCenterPeople',
		displayName: 'Planning Center People',
		description:
			'People profiles, contact info, custom fields, and lists for Planning Center.',
		logoConst: 'PLANNING_CENTER_PEOPLE_LOGO_URL',
		logoColor: '#3B82F6',
		logoIcon:
			'<circle cx="32" cy="24" r="10" fill="#fff"/><path d="M16 52c0-9 7-16 16-16s16 7 16 16" fill="#fff"/>',
		userAgent: 'Activepieces Planning Center People (https://activepieces.com)',
		validatePath: '/people/v2/people',
		validateScope: 'People',
		actions: [
			{
				file: 'list-people',
				export: 'listPeopleAction',
				name: 'list_people',
				displayName: 'List People',
				description: 'Lists people with optional name search.',
				ai: 'List Planning Center people. Use to search directories or sync profiles. Supports optional name search. Read-only and safe to retry.',
				listPath: '/people/v2/people',
				search: true,
			},
			{
				file: 'get-person',
				export: 'getPersonAction',
				name: 'get_person',
				displayName: 'Get Person',
				description: 'Gets a single person profile by ID.',
				ai: 'Get one person profile including household, campus, and status fields. Read-only and safe to retry.',
				getPath: '/people/v2/people/{person}',
				param: 'person',
			},
			{
				file: 'list-person-emails',
				export: 'listPersonEmailsAction',
				name: 'list_person_emails',
				displayName: 'List Person Emails',
				description: 'Lists email addresses for a person.',
				ai: 'List emails for a person. Use when syncing contact info or validating communication channels. Read-only and safe to retry.',
				listPath: '/people/v2/people/{person}/emails',
				param: 'person',
			},
			{
				file: 'list-person-phone-numbers',
				export: 'listPersonPhoneNumbersAction',
				name: 'list_person_phone_numbers',
				displayName: 'List Person Phone Numbers',
				description: 'Lists phone numbers for a person.',
				ai: 'List phone numbers for a person. Use for directory sync or SMS workflows. Read-only and safe to retry.',
				listPath: '/people/v2/people/{person}/phone_numbers',
				param: 'person',
			},
			{
				file: 'list-person-addresses',
				export: 'listPersonAddressesAction',
				name: 'list_person_addresses',
				displayName: 'List Person Addresses',
				description: 'Lists addresses for a person.',
				ai: 'List addresses for a person. Use for mailing lists or geographic reporting. Read-only and safe to retry.',
				listPath: '/people/v2/people/{person}/addresses',
				param: 'person',
			},
			{
				file: 'list-field-data',
				export: 'listFieldDataAction',
				name: 'list_field_data',
				displayName: 'List Field Data',
				description: 'Lists custom field values across people.',
				ai: 'List custom field data (membership, shirt size, background check, etc.). Read-only and safe to retry.',
				listPath: '/people/v2/field_data',
			},
			{
				file: 'list-lists',
				export: 'listListsAction',
				name: 'list_lists',
				displayName: 'List Lists',
				description: 'Lists dynamic and static people lists.',
				ai: 'List People lists. Use before pulling list membership for automations. Read-only and safe to retry.',
				listPath: '/people/v2/lists',
			},
			{
				file: 'list-list-people',
				export: 'listListPeopleAction',
				name: 'list_list_people',
				displayName: 'List List People',
				description: 'Lists people in a specific list.',
				ai: 'List members of a People list. Use for list-based workflow triggers and exports. Read-only and safe to retry.',
				listPath: '/people/v2/lists/{list}/people',
				param: 'list',
			},
		],
		dropdowns: ['person', 'list'],
	},
	{
		folder: 'planning-center-groups',
		packageName: '@activepieces/piece-planning-center-groups',
		exportName: 'planningCenterGroups',
		displayName: 'Planning Center Groups',
		description:
			'Small groups, memberships, events, and attendance for Planning Center Groups.',
		logoConst: 'PLANNING_CENTER_GROUPS_LOGO_URL',
		logoColor: '#10B981',
		logoIcon:
			'<circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="32" cy="20" r="7" fill="#fff"/>',
		userAgent: 'Activepieces Planning Center Groups (https://activepieces.com)',
		validatePath: '/groups/v2/groups',
		validateScope: 'Groups',
		actions: [
			{
				file: 'list-groups',
				export: 'listGroupsAction',
				name: 'list_groups',
				displayName: 'List Groups',
				description: 'Lists all groups.',
				ai: 'List Planning Center groups. Use to discover group_id values and metadata. Read-only and safe to retry.',
				listPath: '/groups/v2/groups',
			},
			{
				file: 'list-group-memberships',
				export: 'listGroupMembershipsAction',
				name: 'list_group_memberships',
				displayName: 'List Group Memberships',
				description: 'Lists members and roles for a group.',
				ai: 'List group memberships including leader/member roles. Use for roster sync. Read-only and safe to retry.',
				listPath: '/groups/v2/groups/{group}/memberships',
				param: 'group',
			},
			{
				file: 'list-group-events',
				export: 'listGroupEventsAction',
				name: 'list_group_events',
				displayName: 'List Group Events',
				description: 'Lists events for a group.',
				ai: 'List group events/meetings. Use before pulling attendance. Read-only and safe to retry.',
				listPath: '/groups/v2/groups/{group}/events',
				param: 'group',
			},
			{
				file: 'list-event-attendances',
				export: 'listEventAttendancesAction',
				name: 'list_event_attendances',
				displayName: 'List Event Attendances',
				description: 'Lists attendance for a group event.',
				ai: 'List attendance records for a group event. Use for follow-up automations. Read-only and safe to retry.',
				listPath: '/groups/v2/events/{group_event}/attendances',
				param: 'group_event',
			},
		],
		dropdowns: ['group', 'group_event'],
	},
	{
		folder: 'planning-center-registrations',
		packageName: '@activepieces/piece-planning-center-registrations',
		exportName: 'planningCenterRegistrations',
		displayName: 'Planning Center Registrations',
		description:
			'Events, attendees, registrations, forms, and answers for Planning Center Registrations.',
		logoConst: 'PLANNING_CENTER_REGISTRATIONS_LOGO_URL',
		logoColor: '#8B5CF6',
		logoIcon:
			'<rect x="18" y="16" width="28" height="34" rx="4" fill="#fff"/><rect x="24" y="10" width="16" height="8" rx="3" fill="#fff"/>',
		userAgent:
			'Activepieces Planning Center Registrations (https://activepieces.com)',
		validatePath: '/registrations/v2/events',
		validateScope: 'Registrations',
		actions: [
			{
				file: 'list-events',
				export: 'listEventsAction',
				name: 'list_events',
				displayName: 'List Events',
				description: 'Lists registration events.',
				ai: 'List Registrations events. Use to find event_id before attendees or forms. Read-only and safe to retry.',
				listPath: '/registrations/v2/events',
			},
			{
				file: 'list-attendees',
				export: 'listAttendeesAction',
				name: 'list_attendees',
				displayName: 'List Attendees',
				description: 'Lists attendees for an event.',
				ai: 'List event attendees including payment status. Read-only and safe to retry.',
				listPath: '/registrations/v2/events/{registration_event}/attendees',
				param: 'registration_event',
			},
			{
				file: 'list-registrations',
				export: 'listRegistrationsAction',
				name: 'list_registrations',
				displayName: 'List Registrations',
				description: 'Lists registration records.',
				ai: 'List registration records with payment and add-on details. Read-only and safe to retry.',
				listPath: '/registrations/v2/registrations',
			},
			{
				file: 'list-event-forms',
				export: 'listEventFormsAction',
				name: 'list_event_forms',
				displayName: 'List Event Forms',
				description: 'Lists forms for an event.',
				ai: 'List forms attached to a registration event. Read-only and safe to retry.',
				listPath: '/registrations/v2/events/{registration_event}/forms',
				param: 'registration_event',
			},
			{
				file: 'list-form-fields',
				export: 'listFormFieldsAction',
				name: 'list_form_fields',
				displayName: 'List Form Fields',
				description: 'Lists fields on a registration form.',
				ai: 'List fields for a registration form. Use before exporting answers. Read-only and safe to retry.',
				listPath: '/registrations/v2/forms/{form}/fields',
				param: 'form',
			},
			{
				file: 'list-registration-answers',
				export: 'listRegistrationAnswersAction',
				name: 'list_registration_answers',
				displayName: 'List Registration Answers',
				description: 'Lists form answers for a registration.',
				ai: 'List custom form answers for a registration. Use for event data export and follow-ups. Read-only and safe to retry.',
				listPath: '/registrations/v2/registrations/{registration}/answers',
				param: 'registration',
			},
		],
		dropdowns: ['registration_event', 'form', 'registration'],
	},
	{
		folder: 'planning-center-calendar',
		packageName: '@activepieces/piece-planning-center-calendar',
		exportName: 'planningCenterCalendar',
		displayName: 'Planning Center Calendar',
		description:
			'Calendar events, resources, reservations, and room bookings for Planning Center.',
		logoConst: 'PLANNING_CENTER_CALENDAR_LOGO_URL',
		logoColor: '#EF4444',
		logoIcon:
			'<rect x="14" y="18" width="36" height="30" rx="4" fill="#fff"/><rect x="14" y="18" width="36" height="8" rx="4" fill="#FCA5A5"/><rect x="20" y="32" width="8" height="8" rx="1.5" fill="#EF4444"/><rect x="32" y="32" width="8" height="8" rx="1.5" fill="#EF4444"/>',
		userAgent:
			'Activepieces Planning Center Calendar (https://activepieces.com)',
		validatePath: '/calendar/v2/events',
		validateScope: 'Calendar',
		actions: [
			{
				file: 'list-events',
				export: 'listEventsAction',
				name: 'list_events',
				displayName: 'List Events',
				description: 'Lists calendar events.',
				ai: 'List Calendar events. Use for facility and schedule visibility. Read-only and safe to retry.',
				listPath: '/calendar/v2/events',
			},
			{
				file: 'list-event-instances',
				export: 'listEventInstancesAction',
				name: 'list_event_instances',
				displayName: 'List Event Instances',
				description: 'Lists occurrences of a recurring event.',
				ai: 'List event instances for recurring calendar events. Read-only and safe to retry.',
				listPath: '/calendar/v2/events/{calendar_event}/event_instances',
				param: 'calendar_event',
			},
			{
				file: 'list-resources',
				export: 'listResourcesAction',
				name: 'list_resources',
				displayName: 'List Resources',
				description: 'Lists rooms and reservable resources.',
				ai: 'List calendar resources (rooms, equipment). Read-only and safe to retry.',
				listPath: '/calendar/v2/resources',
			},
			{
				file: 'list-reservations',
				export: 'listReservationsAction',
				name: 'list_reservations',
				displayName: 'List Reservations',
				description: 'Lists room and resource reservations.',
				ai: 'List reservations for conflict detection and approvals. Read-only and safe to retry.',
				listPath: '/calendar/v2/reservations',
			},
			{
				file: 'list-event-resource-bookings',
				export: 'listEventResourceBookingsAction',
				name: 'list_event_resource_bookings',
				displayName: 'List Event Resource Bookings',
				description: 'Lists resource bookings for an event.',
				ai: 'List rooms/equipment booked for a calendar event. Read-only and safe to retry.',
				listPath: '/calendar/v2/events/{calendar_event}/resource_bookings',
				param: 'calendar_event',
			},
		],
		dropdowns: ['calendar_event'],
	},
	{
		folder: 'planning-center-publishing',
		packageName: '@activepieces/piece-planning-center-publishing',
		exportName: 'planningCenterPublishing',
		displayName: 'Planning Center Publishing',
		description:
			'Sermon channels, series, episodes, speakers, and organization settings for Publishing.',
		logoConst: 'PLANNING_CENTER_PUBLISHING_LOGO_URL',
		logoColor: '#6366F1',
		logoIcon:
			'<polygon points="26,18 46,32 26,46" fill="#fff"/><rect x="16" y="18" width="6" height="28" rx="2" fill="#fff"/>',
		userAgent:
			'Activepieces Planning Center Publishing (https://activepieces.com)',
		validatePath: '/publishing/v2/channels',
		validateScope: 'Publishing',
		actions: [
			{
				file: 'list-channels',
				export: 'listChannelsAction',
				name: 'list_channels',
				displayName: 'List Channels',
				description: 'Lists publishing channels.',
				ai: 'List Publishing channels (sermon feeds). Read-only and safe to retry.',
				listPath: '/publishing/v2/channels',
			},
			{
				file: 'get-channel',
				export: 'getChannelAction',
				name: 'get_channel',
				displayName: 'Get Channel',
				description: 'Gets a single channel.',
				ai: 'Get one Publishing channel metadata. Read-only and safe to retry.',
				getPath: '/publishing/v2/channels/{channel}',
				param: 'channel',
			},
			{
				file: 'list-series',
				export: 'listSeriesAction',
				name: 'list_series',
				displayName: 'List Series',
				description: 'Lists sermon series.',
				ai: 'List sermon series with artwork and descriptions. Read-only and safe to retry.',
				listPath: '/publishing/v2/series',
			},
			{
				file: 'get-series',
				export: 'getSeriesAction',
				name: 'get_series',
				displayName: 'Get Series',
				description: 'Gets a single series.',
				ai: 'Get one sermon series by id. Read-only and safe to retry.',
				getPath: '/publishing/v2/series/{series}',
				param: 'series',
			},
			{
				file: 'list-episodes',
				export: 'listEpisodesAction',
				name: 'list_episodes',
				displayName: 'List Episodes',
				description: 'Lists sermon episodes.',
				ai: 'List Publishing episodes (sermons) with metadata and media. Read-only and safe to retry.',
				listPath: '/publishing/v2/episodes',
			},
			{
				file: 'get-episode',
				export: 'getEpisodeAction',
				name: 'get_episode',
				displayName: 'Get Episode',
				description: 'Gets a single episode.',
				ai: 'Get one episode including scripture, speaker, and publish status. Read-only and safe to retry.',
				getPath: '/publishing/v2/episodes/{episode}',
				param: 'episode',
			},
			{
				file: 'list-episode-times',
				export: 'listEpisodeTimesAction',
				name: 'list_episode_times',
				displayName: 'List Episode Times',
				description: 'Lists scheduled publish times for an episode.',
				ai: 'List episode publish times for sync to external platforms. Read-only and safe to retry.',
				listPath: '/publishing/v2/episodes/{episode}/episode_times',
				param: 'episode',
			},
			{
				file: 'list-speakers',
				export: 'listSpeakersAction',
				name: 'list_speakers',
				displayName: 'List Speakers',
				description: 'Lists speakers.',
				ai: 'List Publishing speakers. Read-only and safe to retry.',
				listPath: '/publishing/v2/speakers',
			},
			{
				file: 'get-speaker',
				export: 'getSpeakerAction',
				name: 'get_speaker',
				displayName: 'Get Speaker',
				description: 'Gets a single speaker.',
				ai: 'Get speaker bio and image by id. Read-only and safe to retry.',
				getPath: '/publishing/v2/speakers/{speaker}',
				param: 'speaker',
			},
			{
				file: 'list-speakerships',
				export: 'listSpeakershipsAction',
				name: 'list_speakerships',
				displayName: 'List Speakerships',
				description: 'Lists speaker-to-episode mappings.',
				ai: 'List speakerships mapping speakers to episodes. Read-only and safe to retry.',
				listPath: '/publishing/v2/speakerships',
			},
			{
				file: 'get-organization',
				export: 'getOrganizationAction',
				name: 'get_organization',
				displayName: 'Get Organization',
				description: 'Gets Publishing organization settings.',
				ai: 'Get global Publishing organization settings and branding defaults. Read-only and safe to retry.',
				getPath: '/publishing/v2/organization',
				singleFixed: true,
			},
		],
		dropdowns: ['channel', 'series', 'episode', 'speaker'],
	},
];

function authTs(validatePath, validateScope) {
	return `import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { planningCenterClient } from './common/client';

export const planningCenterAuth = PieceAuth.CustomAuth({
	displayName: 'Personal Access Token',
	description:
		'Connect with a Planning Center Personal Access Token using HTTP Basic Auth.',
	required: true,
	props: {
		setup_instructions: Property.MarkDown({
			value: \`## Setup Instructions
1. Sign in to your [Planning Center developer account](https://api.planningcenteronline.com/personal_access_tokens)
2. Create a new **Personal Access Token**
3. Copy the **Application ID** and **Secret**
4. Paste them into the fields below\`,
		}),
		application_id: Property.ShortText({
			displayName: 'Application ID',
			description:
				'The Application ID (client_id) shown when you create a Personal Access Token.',
			required: true,
		}),
		secret: PieceAuth.SecretText({
			displayName: 'Secret',
			description:
				'The Secret shown once when you create a Personal Access Token. Store it securely.',
			required: true,
		}),
	},
	validate: async ({ auth }) => {
		try {
			await planningCenterClient.apiCall({
				credentials: {
					applicationId: auth.application_id,
					secret: auth.secret,
				},
				method: HttpMethod.GET,
				path: '${validatePath}',
				queryParams: { per_page: '1' },
			});
			return { valid: true };
		} catch {
			return {
				valid: false,
				error:
					'Invalid Application ID or Secret. Verify your Personal Access Token and ${validateScope} permissions.',
			};
		}
	},
});
`;
}

function listActionTs(action) {
	const props = ["fetch_all_pages: planningCenterCommon.fetchAllPages"];
	if (action.search) {
		props.unshift('person_search: planningCenterCommon.personSearch');
	}
	if (action.param) {
		const key = action.param;
		const dropdown =
			key === 'person'
				? 'person'
				: key === 'list'
					? 'list'
					: key === 'group'
						? 'group'
						: key === 'group_event'
							? 'groupEvent'
							: key === 'registration_event'
								? 'registrationEvent'
								: key === 'form'
									? 'form'
									: key === 'registration'
										? 'registration'
										: key === 'calendar_event'
											? 'calendarEvent'
											: key === 'channel'
												? 'channel'
												: key === 'series'
													? 'series'
													: key === 'episode'
														? 'episode'
														: key === 'speaker'
															? 'speaker'
															: key;
		props.unshift(`${key}: planningCenterCommon.${dropdown}Dropdown`);
	}

	const queryBlock = action.search
		? `
		const queryParams: Record<string, string> = {};
		const { person_search } = context.propsValue;
		if (typeof person_search === 'string' && person_search.length > 0) {
			queryParams['where[search_name]'] = person_search;
		}`
		: '';

	const pathExpr = action.listPath.includes('{')
		? '`' + action.listPath.replace(/\{(\w+)\}/g, '${$1}') + '`'
		: `'${action.listPath}'`;

	return `import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const ${action.export} = createAction({
	auth: planningCenterAuth,
	name: '${action.name}',
	displayName: '${action.displayName}',
	description: '${action.description}',
	audience: 'both',
	aiMetadata: {
		description: '${action.ai}',
		idempotent: true,
	},
	props: {
		${props.join(',\n\t\t')},
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const fetchAll = context.propsValue.fetch_all_pages ?? true;${queryBlock}

		return await planningCenterClient.listResources({
			credentials,
			path: ${pathExpr},
			${action.search ? 'queryParams,' : ''}
			fetchAll,
		});
	},
});
`;
}

function getActionTs(action) {
	const param = action.param;
	const pathExpr = '`' + action.getPath.replace(/\{(\w+)\}/g, '${$1}') + '`';
	const dropdown =
		param === 'person'
			? 'person'
			: param === 'channel'
				? 'channel'
				: param === 'series'
					? 'series'
					: param === 'episode'
						? 'episode'
						: param === 'speaker'
							? 'speaker'
							: param;

	return `import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const ${action.export} = createAction({
	auth: planningCenterAuth,
	name: '${action.name}',
	displayName: '${action.displayName}',
	description: '${action.description}',
	audience: 'both',
	aiMetadata: {
		description: '${action.ai}',
		idempotent: true,
	},
	props: {
		${param}: planningCenterCommon.${dropdown}Dropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { ${param} } = context.propsValue;

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.GET,
			path: ${pathExpr},
		});

		if (!response.body.data) {
			throw new Error('Resource not found.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});

type JsonApiSingleResponse = {
	data?: {
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	};
};
`;
}

function getFixedActionTs(action) {
	return `import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';

export const ${action.export} = createAction({
	auth: planningCenterAuth,
	name: '${action.name}',
	displayName: '${action.displayName}',
	description: '${action.description}',
	audience: 'both',
	aiMetadata: {
		description: '${action.ai}',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.GET,
			path: '${action.getPath}',
		});

		if (!response.body.data) {
			throw new Error('Resource not found.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});

type JsonApiSingleResponse = {
	data?: {
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	};
};
`;
}

function propsTs(dropdowns) {
	const blocks = [];
	blocks.push(`	fetchAllPages: Property.Checkbox({
		displayName: 'Fetch All Pages',
		description:
			'When enabled, automatically fetches every page of results (up to API limits).',
		required: false,
		defaultValue: true,
	}),`);

	if (dropdowns.includes('person')) {
		blocks.push(`
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
						label: planningCenterClient.getStringAttribute(r, 'name') ?? \`Person \${r.id}\`,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load people.' };
			}
		},
	}),`);
	}

	const dropdownDefs = {
		list: {
			path: '/people/v2/lists',
			label: 'name',
			placeholder: 'Untitled List',
			display: 'List',
			desc: 'The people list to query.',
		},
		group: {
			path: '/groups/v2/groups',
			label: 'name',
			placeholder: 'Untitled Group',
			display: 'Group',
			desc: 'The group to query.',
			refreshers: [],
		},
		group_event: {
			path: '/groups/v2/groups/{group}/events',
			label: 'name',
			placeholder: 'Untitled Event',
			display: 'Group Event',
			desc: 'The group event for attendance.',
			refreshers: ['group'],
			param: 'group',
		},
		registration_event: {
			path: '/registrations/v2/events',
			label: 'name',
			placeholder: 'Untitled Event',
			display: 'Registration Event',
			desc: 'The registration event.',
			refreshers: [],
		},
		form: {
			path: '/registrations/v2/events/{registration_event}/forms',
			label: 'name',
			placeholder: 'Untitled Form',
			display: 'Form',
			desc: 'The registration form.',
			refreshers: ['registration_event'],
			param: 'registration_event',
		},
		registration: {
			path: '/registrations/v2/registrations',
			label: 'id',
			placeholder: 'Registration',
			display: 'Registration',
			desc: 'The registration record.',
			refreshers: [],
		},
		calendar_event: {
			path: '/calendar/v2/events',
			label: 'title',
			placeholder: 'Untitled Event',
			display: 'Calendar Event',
			desc: 'The calendar event.',
			refreshers: [],
		},
		channel: {
			path: '/publishing/v2/channels',
			label: 'name',
			placeholder: 'Untitled Channel',
			display: 'Channel',
			desc: 'The publishing channel.',
			refreshers: [],
		},
		series: {
			path: '/publishing/v2/series',
			label: 'title',
			placeholder: 'Untitled Series',
			display: 'Series',
			desc: 'The sermon series.',
			refreshers: [],
		},
		episode: {
			path: '/publishing/v2/episodes',
			label: 'title',
			placeholder: 'Untitled Episode',
			display: 'Episode',
			desc: 'The sermon episode.',
			refreshers: [],
		},
		speaker: {
			path: '/publishing/v2/speakers',
			label: 'name',
			placeholder: 'Untitled Speaker',
			display: 'Speaker',
			desc: 'The speaker.',
			refreshers: [],
		},
	};

	for (const key of dropdowns) {
		if (key === 'person') continue;
		const def = dropdownDefs[key];
		const propName = key === 'group_event' ? 'groupEvent' : key === 'registration_event' ? 'registrationEvent' : key === 'calendar_event' ? 'calendarEvent' : key;
		const refreshers = def.refreshers?.length
			? `refreshers: [${def.refreshers.map((r) => `'${r}'`).join(', ')}],`
			: 'refreshers: [],';
		const optionsParams = def.param
			? `{ auth, ${def.param} }`
			: '{ auth }';
		const guard = def.param
			? `if (!auth || !${def.param}) {
				return { disabled: true, options: [], placeholder: 'Select ${def.refreshers[0].replace(/_/g, ' ')} first' };
			}`
			: `if (!auth) {
				return { disabled: true, options: [], placeholder: 'Connect your account first' };
			}`;
		const path = def.param
			? `\`/groups/v2/groups/\${group}/events\``.replace('group', '${' + def.param + '}')
			: `'${def.path}'`;
		const actualPath = def.param
			? key === 'group_event'
				? '`/groups/v2/groups/${group}/events`'
				: key === 'form'
					? '`/registrations/v2/events/${registration_event}/forms`'
					: `'${def.path}'`
			: `'${def.path}'`;

		blocks.push(`
	${propName}Dropdown: Property.Dropdown({
		displayName: '${def.display}',
		description: '${def.desc}',
		auth: planningCenterAuth,
		${refreshers}
		required: true,
		options: async (${optionsParams}) => {
			${guard}
			try {
				const credentials = planningCenterClient.credentialsFromAuthProps(auth.props);
				const resources = await planningCenterClient.paginatedApiCall({
					credentials,
					path: ${actualPath},
				});
				return {
					disabled: false,
					options: resources.map((r) => ({
						label: planningCenterClient.getStringAttribute(r, '${def.label}') ?? '${def.placeholder} ' + r.id,
						value: r.id,
					})),
				};
			} catch {
				return { disabled: true, options: [], placeholder: 'Failed to load options.' };
			}
		},
	}),`);
	}

	return `import { Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';

export const planningCenterCommon = {${blocks.join('')}
};
`;
}

for (const piece of PIECES) {
	const dir = join(ROOT, piece.folder);
	if (existsSync(dir)) {
		console.log(`Skipping existing ${piece.folder}`);
		continue;
	}
	mkdirSync(join(dir, 'src/lib/actions'), { recursive: true });
	mkdirSync(join(dir, 'src/lib/common'), { recursive: true });
	mkdirSync(join(dir, 'src/i18n'), { recursive: true });

	writeFileSync(join(dir, '.eslintrc.json'), ESLINT);
	writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
	writeFileSync(join(dir, 'tsconfig.lib.json'), TSCONFIG_LIB);
	writeFileSync(
		join(dir, 'package.json'),
		JSON.stringify(
			{
				name: piece.packageName,
				version: '0.0.1',
				main: './dist/src/index.js',
				types: './dist/src/index.d.ts',
				scripts: {
					build:
						'tsc -p tsconfig.lib.json && cp package.json dist/ && cp -r src/i18n dist/src/',
					lint: "eslint 'src/**/*.ts'",
				},
				dependencies: {
					'@activepieces/pieces-common': 'workspace:*',
					'@activepieces/pieces-framework': 'workspace:*',
				},
				devDependencies: { tslib: '2.6.2' },
			},
			null,
			2,
		) + '\n',
	);

	writeFileSync(join(dir, 'src/lib/common/client.ts'), CLIENT_TEMPLATE(piece.userAgent));
	writeFileSync(join(dir, 'src/lib/auth.ts'), authTs(piece.validatePath, piece.validateScope));
	writeFileSync(join(dir, 'src/lib/common/props.ts'), propsTs(piece.dropdowns));
	writeFileSync(join(dir, 'src/i18n/translation.json'), '{}\n');

	for (const action of piece.actions) {
		let content;
		if (action.singleFixed) {
			content = getFixedActionTs(action);
		} else if (action.getPath) {
			content = getActionTs(action);
		} else {
			content = listActionTs(action);
		}
		writeFileSync(join(dir, 'src/lib/actions', `${action.file}.ts`), content);
	}

	const imports = piece.actions
		.map((a) => `import { ${a.export} } from './lib/actions/${a.file}';`)
		.join('\n');
	const actionRefs = piece.actions.map((a) => `\t\t${a.export},`).join('\n');
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${piece.logoColor}"/>${piece.logoIcon}</svg>`;

	const indexTs = `import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { planningCenterAuth } from './lib/auth';
${imports}
import { planningCenterClient } from './lib/common/client';

const ${piece.logoConst} = \`data:image/svg+xml,\${encodeURIComponent(
	'${svg.replace(/'/g, "\\'")}',
)}\`;

export const ${piece.exportName} = createPiece({
	displayName: '${piece.displayName}',
	description: '${piece.description}',
	minimumSupportedRelease: '0.36.1',
	logoUrl: ${piece.logoConst},
	categories: [PieceCategory.PRODUCTIVITY],
	auth: planningCenterAuth,
	authors: ['activepieces'],
	actions: [
${actionRefs}
		createCustomApiCallAction({
			auth: planningCenterAuth,
			baseUrl: () => planningCenterClient.BASE_URL,
			authMapping: async (auth) => {
				const credentials = planningCenterClient.credentialsFromAuthProps(auth.props);
				const encoded = Buffer.from(
					\`\${credentials.applicationId}:\${credentials.secret}\`,
				).toString('base64');
				return {
					Authorization: \`Basic \${encoded}\`,
					'User-Agent': '${piece.userAgent}',
				};
			},
		}),
	],
	triggers: [],
});
`;
	writeFileSync(join(dir, 'src/index.ts'), indexTs);
	console.log(`Created ${piece.folder}`);
}

console.log('Done.');