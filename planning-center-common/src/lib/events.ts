import { PcoWebhookTriggerOutput } from './parse';

export type PcoApp =
	| 'people'
	| 'services'
	| 'publishing'
	| 'groups'
	| 'calendar';

export type PcoWebhookEventDefinition = {
	app: PcoApp;
	name: string;
	displayName: string;
	description: string;
	aiDescription: string;
	eventName: string;
	sampleData: PcoWebhookTriggerOutput;
};

const SAMPLE_BASE: Omit<
	PcoWebhookTriggerOutput,
	| 'event_name'
	| 'action'
	| 'resource_type'
	| 'resource_id'
	| 'resource'
	| 'relationships'
> = {
	delivery_id: 'sample-delivery-id',
	event_time: '2026-07-02T23:00:00Z',
	idempotency_token: 'sample-idempotency-token',
	meta: {
		parent: { id: 'sample-parent', type: 'Organization' },
		event_time: '2026-07-02T23:00:00Z',
		idempotency_token: 'sample-idempotency-token',
	},
};

function buildSample({
	eventName,
	resourceType,
	resourceId,
	resource,
	relationships = {},
}: {
	eventName: string;
	resourceType: string;
	resourceId: string;
	resource: Record<string, unknown>;
	relationships?: Record<string, unknown>;
}): PcoWebhookTriggerOutput {
	const action = eventName.split('.').pop() ?? 'unknown';
	return {
		...SAMPLE_BASE,
		event_name: eventName,
		action,
		resource_type: resourceType,
		resource_id: resourceId,
		resource,
		relationships,
	};
}

export const PCO_WEBHOOK_EVENTS: PcoWebhookEventDefinition[] = [
	{
		app: 'people',
		name: 'person_created',
		displayName: 'Person Created',
		description: 'Triggers when a new person profile is created in Planning Center People.',
		aiDescription:
			'Fires when Planning Center People creates a new person profile. Use for onboarding, CRM sync, welcome workflows, and data enrichment.',
		eventName: 'people.v2.events.person.created',
		sampleData: buildSample({
			eventName: 'people.v2.events.person.created',
			resourceType: 'Person',
			resourceId: '12345',
			resource: {
				id: '12345',
				type: 'Person',
				first_name: 'Alex',
				last_name: 'Sample',
				name: 'Alex Sample',
				status: 'active',
				created_at: '2026-07-02T23:00:00Z',
				updated_at: '2026-07-02T23:00:00Z',
			},
		}),
	},
	{
		app: 'people',
		name: 'person_updated',
		displayName: 'Person Updated',
		description: 'Triggers when an existing person profile is updated in Planning Center People.',
		aiDescription:
			'Fires when a person profile changes in Planning Center People. Use to sync contact info, membership status, and profile updates to external systems.',
		eventName: 'people.v2.events.person.updated',
		sampleData: buildSample({
			eventName: 'people.v2.events.person.updated',
			resourceType: 'Person',
			resourceId: '12345',
			resource: {
				id: '12345',
				type: 'Person',
				first_name: 'Alex',
				last_name: 'Sample',
				name: 'Alex Sample',
				status: 'active',
				updated_at: '2026-07-02T23:05:00Z',
			},
		}),
	},
	{
		app: 'people',
		name: 'form_submission_created',
		displayName: 'Form Submitted',
		description: 'Triggers when someone submits a Planning Center People form.',
		aiDescription:
			'Fires when a new form submission is recorded in Planning Center People. One of the most broadly useful People triggers for intake and follow-up automations.',
		eventName: 'people.v2.events.form_submission.created',
		sampleData: buildSample({
			eventName: 'people.v2.events.form_submission.created',
			resourceType: 'FormSubmission',
			resourceId: '67890',
			resource: {
				id: '67890',
				type: 'FormSubmission',
				created_at: '2026-07-02T23:00:00Z',
				updated_at: '2026-07-02T23:00:00Z',
				selected_options_by_field: {},
			},
			relationships: {
				person: { data: { type: 'Person', id: '12345' } },
				form: { data: { type: 'Form', id: '111' } },
			},
		}),
	},
	{
		app: 'people',
		name: 'list_result_created',
		displayName: 'Person Added to List',
		description: 'Triggers when a person is added to a list or smart list result.',
		aiDescription:
			'Fires when a person appears on a Planning Center list result. Use for list-based automations, audience sync, and segmented follow-up.',
		eventName: 'people.v2.events.list_result.created',
		sampleData: buildSample({
			eventName: 'people.v2.events.list_result.created',
			resourceType: 'ListResult',
			resourceId: '222',
			resource: {
				id: '222',
				type: 'ListResult',
				created_at: '2026-07-02T23:00:00Z',
			},
			relationships: {
				person: { data: { type: 'Person', id: '12345' } },
				list: { data: { type: 'List', id: '333' } },
			},
		}),
	},
	{
		app: 'people',
		name: 'list_result_destroyed',
		displayName: 'Person Removed from List',
		description: 'Triggers when a person is removed from a list or smart list result.',
		aiDescription:
			'Fires when a person is removed from a Planning Center list result. Use to remove someone from external sequences, tags, or audiences.',
		eventName: 'people.v2.events.list_result.destroyed',
		sampleData: buildSample({
			eventName: 'people.v2.events.list_result.destroyed',
			resourceType: 'ListResult',
			resourceId: '222',
			resource: { id: '222', type: 'ListResult' },
			relationships: {
				person: { data: { type: 'Person', id: '12345' } },
				list: { data: { type: 'List', id: '333' } },
			},
		}),
	},
	{
		app: 'people',
		name: 'workflow_card_step_ready',
		displayName: 'Workflow Card Ready',
		description: 'Triggers when a workflow card step becomes ready for action.',
		aiDescription:
			'Fires when a Planning Center workflow card reaches a ready step. Use for task creation, staff notifications, and external handoffs.',
		eventName: 'people.v2.events.workflow_card.step_ready',
		sampleData: buildSample({
			eventName: 'people.v2.events.workflow_card.step_ready',
			resourceType: 'WorkflowCard',
			resourceId: '444',
			resource: {
				id: '444',
				type: 'WorkflowCard',
				stage: 'ready',
				updated_at: '2026-07-02T23:00:00Z',
			},
			relationships: {
				person: { data: { type: 'Person', id: '12345' } },
				workflow: { data: { type: 'Workflow', id: '555' } },
			},
		}),
	},
	{
		app: 'people',
		name: 'workflow_card_created',
		displayName: 'Workflow Card Created',
		description: 'Triggers when a new workflow card is created.',
		aiDescription:
			'Fires when a new Planning Center workflow card is created. Use when a follow-up process begins.',
		eventName: 'people.v2.events.workflow_card.created',
		sampleData: buildSample({
			eventName: 'people.v2.events.workflow_card.created',
			resourceType: 'WorkflowCard',
			resourceId: '444',
			resource: {
				id: '444',
				type: 'WorkflowCard',
				stage: 'start',
				created_at: '2026-07-02T23:00:00Z',
			},
			relationships: {
				person: { data: { type: 'Person', id: '12345' } },
				workflow: { data: { type: 'Workflow', id: '555' } },
			},
		}),
	},
	{
		app: 'people',
		name: 'workflow_card_updated',
		displayName: 'Workflow Card Updated',
		description: 'Triggers when a workflow card is updated.',
		aiDescription:
			'Fires when a Planning Center workflow card changes stage, assignment, or completion state. Use for overdue and status-driven automations.',
		eventName: 'people.v2.events.workflow_card.updated',
		sampleData: buildSample({
			eventName: 'people.v2.events.workflow_card.updated',
			resourceType: 'WorkflowCard',
			resourceId: '444',
			resource: {
				id: '444',
				type: 'WorkflowCard',
				stage: 'in_progress',
				updated_at: '2026-07-02T23:10:00Z',
			},
			relationships: {
				person: { data: { type: 'Person', id: '12345' } },
				workflow: { data: { type: 'Workflow', id: '555' } },
			},
		}),
	},
	{
		app: 'services',
		name: 'plan_updated',
		displayName: 'Plan Updated',
		description: 'Triggers when a Services plan is updated.',
		aiDescription:
			'Fires when a Planning Center Services plan changes. Use to refresh needed positions, plan people, items, and linked Publishing data.',
		eventName: 'services.v2.events.plan.updated',
		sampleData: buildSample({
			eventName: 'services.v2.events.plan.updated',
			resourceType: 'Plan',
			resourceId: '999',
			resource: {
				id: '999',
				type: 'Plan',
				dates: 'Jul 6, 2026',
				sort_date: '2026-07-06',
				needed_positions_count: 3,
				plan_people_count: 12,
				updated_at: '2026-07-02T23:00:00Z',
			},
			relationships: {
				service_type: { data: { type: 'ServiceType', id: '100' } },
			},
		}),
	},
	{
		app: 'publishing',
		name: 'episode_created',
		displayName: 'Episode Created',
		description: 'Triggers when a new Publishing episode is created.',
		aiDescription:
			'Fires when a new Planning Center Publishing episode is created. Use to start sermon or livestream production checklists.',
		eventName: 'publishing.v2.events.episode.created',
		sampleData: buildSample({
			eventName: 'publishing.v2.events.episode.created',
			resourceType: 'Episode',
			resourceId: 'ep-1',
			resource: {
				id: 'ep-1',
				type: 'Episode',
				title: 'Sunday Service',
				created_at: '2026-07-02T23:00:00Z',
				updated_at: '2026-07-02T23:00:00Z',
			},
		}),
	},
	{
		app: 'publishing',
		name: 'episode_updated',
		displayName: 'Episode Updated',
		description: 'Triggers when a Publishing episode is updated.',
		aiDescription:
			'Fires when a Planning Center Publishing episode changes. Title, description, video URL, artwork, and publish timestamps may change after creation.',
		eventName: 'publishing.v2.events.episode.updated',
		sampleData: buildSample({
			eventName: 'publishing.v2.events.episode.updated',
			resourceType: 'Episode',
			resourceId: 'ep-1',
			resource: {
				id: 'ep-1',
				type: 'Episode',
				title: 'Sunday Service',
				video_url: 'https://example.com/video.mp4',
				updated_at: '2026-07-02T23:15:00Z',
			},
		}),
	},
	{
		app: 'groups',
		name: 'group_application_created',
		displayName: 'Group Application Submitted',
		description: 'Triggers when a Church Center group application is submitted.',
		aiDescription:
			'Fires when a new Church Center group application is submitted. Use for leader follow-up and connection workflows.',
		eventName: 'groups.church_center.v2.events.group_application.created',
		sampleData: buildSample({
			eventName: 'groups.church_center.v2.events.group_application.created',
			resourceType: 'GroupApplication',
			resourceId: 'ga-1',
			resource: {
				id: 'ga-1',
				type: 'GroupApplication',
				status: 'pending',
				created_at: '2026-07-02T23:00:00Z',
			},
			relationships: {
				group: { data: { type: 'Group', id: 'g-1' } },
				person: { data: { type: 'Person', id: '12345' } },
			},
		}),
	},
	{
		app: 'groups',
		name: 'group_application_updated',
		displayName: 'Group Application Updated',
		description: 'Triggers when a Church Center group application is updated.',
		aiDescription:
			'Fires when a Church Center group application status or details change. Use for approval and follow-up automations.',
		eventName: 'groups.church_center.v2.events.group_application.updated',
		sampleData: buildSample({
			eventName: 'groups.church_center.v2.events.group_application.updated',
			resourceType: 'GroupApplication',
			resourceId: 'ga-1',
			resource: {
				id: 'ga-1',
				type: 'GroupApplication',
				status: 'approved',
				updated_at: '2026-07-02T23:10:00Z',
			},
			relationships: {
				group: { data: { type: 'Group', id: 'g-1' } },
				person: { data: { type: 'Person', id: '12345' } },
			},
		}),
	},
	{
		app: 'groups',
		name: 'membership_created',
		displayName: 'Person Joined Group',
		description: 'Triggers when a person joins a group.',
		aiDescription:
			'Fires when a new group membership is created. Use for welcome messages, CRM tags, and leader notifications.',
		eventName: 'groups.v2.events.membership.created',
		sampleData: buildSample({
			eventName: 'groups.v2.events.membership.created',
			resourceType: 'Membership',
			resourceId: 'm-1',
			resource: {
				id: 'm-1',
				type: 'Membership',
				role: 'member',
				created_at: '2026-07-02T23:00:00Z',
			},
			relationships: {
				group: { data: { type: 'Group', id: 'g-1' } },
				person: { data: { type: 'Person', id: '12345' } },
			},
		}),
	},
	{
		app: 'groups',
		name: 'membership_destroyed',
		displayName: 'Person Left Group',
		description: 'Triggers when a person leaves or is removed from a group.',
		aiDescription:
			'Fires when a group membership is destroyed. Use for cleanup and leader awareness workflows.',
		eventName: 'groups.v2.events.membership.destroyed',
		sampleData: buildSample({
			eventName: 'groups.v2.events.membership.destroyed',
			resourceType: 'Membership',
			resourceId: 'm-1',
			resource: { id: 'm-1', type: 'Membership' },
			relationships: {
				group: { data: { type: 'Group', id: 'g-1' } },
				person: { data: { type: 'Person', id: '12345' } },
			},
		}),
	},
	{
		app: 'groups',
		name: 'group_created',
		displayName: 'Group Created',
		description: 'Triggers when a new group is created.',
		aiDescription:
			'Fires when a new Planning Center group is created. Use to provision folders, channels, or leader resources.',
		eventName: 'groups.v2.events.group.created',
		sampleData: buildSample({
			eventName: 'groups.v2.events.group.created',
			resourceType: 'Group',
			resourceId: 'g-1',
			resource: {
				id: 'g-1',
				type: 'Group',
				name: 'Young Adults',
				created_at: '2026-07-02T23:00:00Z',
			},
		}),
	},
	{
		app: 'calendar',
		name: 'event_request_created',
		displayName: 'Event Request Submitted',
		description: 'Triggers when a calendar event request is submitted.',
		aiDescription:
			'Fires when a new Planning Center Calendar event request is submitted. Use for facilities review and approval routing.',
		eventName: 'calendar.v2.events.event_request.created',
		sampleData: buildSample({
			eventName: 'calendar.v2.events.event_request.created',
			resourceType: 'EventRequest',
			resourceId: 'er-1',
			resource: {
				id: 'er-1',
				type: 'EventRequest',
				status: 'pending',
				last_activity_at: '2026-07-02T23:00:00Z',
			},
			relationships: {
				event: { data: { type: 'Event', id: 'ev-1' } },
				person: { data: { type: 'Person', id: '12345' } },
			},
		}),
	},
	{
		app: 'calendar',
		name: 'event_request_approved',
		displayName: 'Event Request Approved',
		description: 'Triggers when a calendar event request is approved.',
		aiDescription:
			'Fires when a Planning Center Calendar event request is approved. Use for confirmation messages, room setup, and task lists.',
		eventName: 'calendar.v2.events.event_request.approved',
		sampleData: buildSample({
			eventName: 'calendar.v2.events.event_request.approved',
			resourceType: 'EventRequest',
			resourceId: 'er-1',
			resource: {
				id: 'er-1',
				type: 'EventRequest',
				status: 'approved',
				last_activity_at: '2026-07-02T23:05:00Z',
			},
			relationships: {
				event: { data: { type: 'Event', id: 'ev-1' } },
				person: { data: { type: 'Person', id: '12345' } },
			},
		}),
	},
	{
		app: 'calendar',
		name: 'event_request_updated',
		displayName: 'Event Request Updated',
		description: 'Triggers when a calendar event request is updated.',
		aiDescription:
			'Fires when a Planning Center Calendar event request changes. Use to keep external calendars and production plans in sync.',
		eventName: 'calendar.v2.events.event_request.updated',
		sampleData: buildSample({
			eventName: 'calendar.v2.events.event_request.updated',
			resourceType: 'EventRequest',
			resourceId: 'er-1',
			resource: {
				id: 'er-1',
				type: 'EventRequest',
				status: 'pending',
				last_activity_at: '2026-07-02T23:10:00Z',
			},
			relationships: {
				event: { data: { type: 'Event', id: 'ev-1' } },
				person: { data: { type: 'Person', id: '12345' } },
			},
		}),
	},
];