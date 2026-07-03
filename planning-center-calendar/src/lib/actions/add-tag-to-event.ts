import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const addTagToEventAction = createAction({
	auth: planningCenterAuth,
	name: 'add_tag_to_event',
	displayName: 'Add Tag to Event',
	description: 'Associates an existing tag or creates a new tag on an event.',
	audience: 'both',
	aiMetadata: {
		description:
			'Add a tag to a calendar event for categorization and routing. Linking an existing tag is preferred; creating a new tag may duplicate on retry.',
		idempotent: false,
	},
	props: {
		calendar_event: planningCenterCommon.calendarEventDropdown,
		tag_mode: Property.StaticDropdown({
			displayName: 'Tag Mode',
			description:
				'Link an existing tag or create a new tag on the event.',
			required: true,
			defaultValue: 'existing',
			options: {
				options: [
					{ label: 'Link Existing Tag', value: 'existing' },
					{ label: 'Create New Tag', value: 'new' },
				],
			},
		}),
		tag: planningCenterCommon.tagDropdown,
		tag_name: Property.ShortText({
			displayName: 'New Tag Name',
			description: 'Required when creating a new tag.',
			required: false,
		}),
		tag_color: Property.ShortText({
			displayName: 'Tag Color',
			description: 'Optional hex color code (e.g. #FF5733) for a new tag.',
			required: false,
		}),
		church_center_category: Property.Checkbox({
			displayName: 'Church Center Category',
			description:
				'When enabled, the new tag is used as a category on Church Center.',
			required: false,
			defaultValue: false,
		}),
		tag_group: planningCenterCommon.tagGroupDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			calendar_event,
			tag_mode,
			tag,
			tag_name,
			tag_color,
			church_center_category,
			tag_group,
		} = context.propsValue;

		let body: Record<string, unknown>;

		if (tag_mode === 'existing') {
			if (!tag) {
				throw new Error('Tag is required when linking an existing tag.');
			}
			body = {
				data: {
					type: 'Tag',
					id: tag,
				},
			};
		} else {
			if (!tag_name) {
				throw new Error('New Tag Name is required when creating a new tag.');
			}
			const attributes: Record<string, unknown> = { name: tag_name };
			if (tag_color) {
				attributes['color'] = tag_color;
			}
			if (church_center_category) {
				attributes['church_center_category'] = church_center_category;
			}
			if (tag_group) {
				attributes['tag_group_id'] = tag_group;
			}
			body = {
				data: {
					type: 'Tag',
					attributes,
				},
			};
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.POST,
			path: `/calendar/v2/events/${calendar_event}/tags`,
			body,
		});

		if (!response.body.data) {
			throw new Error('Failed to add tag to event.');
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