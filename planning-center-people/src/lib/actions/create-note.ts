import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

type JsonApiSingleResponse = {
	data?: {
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	};
};

type NoteCreateBody = {
	data: {
		type: string;
		attributes: Record<string, unknown>;
		relationships?: {
			note_category: {
				data: {
					type: string;
					id: string;
				};
			};
		};
	};
};

export const createNoteAction = createAction({
	auth: planningCenterAuth,
	name: 'create_note',
	displayName: 'Create Note',
	description: 'Creates a pastoral care or interaction note on a person profile.',
	audience: 'both',
	aiMetadata: {
		description:
			'Create a note on a person via POST /people/{id}/notes. Each call creates a new note; retries may duplicate.',
		idempotent: false,
	},
	props: {
		person: planningCenterCommon.personDropdown,
		note: Property.LongText({
			displayName: 'Note',
			description: 'The note text to add to the person profile.',
			required: true,
		}),
		note_category: planningCenterCommon.noteCategoryDropdown,
		display_date: Property.DateTime({
			displayName: 'Display Date',
			description:
				'Optional. Date shown on the note (ISO 8601). Defaults to now if omitted.',
			required: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { person, note, note_category: noteCategory, display_date: displayDate } =
			context.propsValue;

		const attributes: Record<string, unknown> = {
			note,
		};
		if (typeof displayDate === 'string' && displayDate.length > 0) {
			attributes['display_date'] = displayDate;
		}
		if (typeof noteCategory === 'string' && noteCategory.length > 0) {
			attributes['note_category_id'] = noteCategory;
		}

		const body: NoteCreateBody = {
			data: {
				type: 'Note',
				attributes,
			},
		};

		if (typeof noteCategory === 'string' && noteCategory.length > 0) {
			body.data.relationships = {
				note_category: {
					data: {
						type: 'NoteCategory',
						id: noteCategory,
					},
				},
			};
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.POST,
			path: `/people/v2/people/${person}/notes`,
			body,
		});

		if (!response.body.data) {
			throw new Error('Failed to create note.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});