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

export const updateNoteTemplateAction = createAction({
	auth: planningCenterAuth,
	name: 'update_note_template',
	displayName: 'Update Note Template',
	description: 'Updates the sermon notes template for an episode.',
	audience: 'both',
	aiMetadata: {
		description:
			'Patch an episode note template content, enabled flag, or auto-create setting. Provide at least one field to change.',
		idempotent: true,
	},
	props: {
		episode: planningCenterCommon.episodeDropdown,
		template: Property.LongText({
			displayName: 'Template',
			description: 'Note template content. Leave empty to keep unchanged.',
			required: false,
		}),
		enabled: Property.Checkbox({
			displayName: 'Enabled',
			description: 'Whether sermon notes are enabled for this episode.',
			required: false,
		}),
		auto_create_free_form_notes: Property.Checkbox({
			displayName: 'Auto Create Free Form Notes',
			description: 'Automatically create free-form notes from the template.',
			required: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			episode,
			template,
			enabled,
			auto_create_free_form_notes: autoCreateFreeFormNotes,
		} = context.propsValue;

		const attributes: Record<string, unknown> = {};

		if (typeof template === 'string' && template.length > 0) {
			attributes['template'] = template;
		}
		if (enabled === true || enabled === false) {
			attributes['enabled'] = enabled;
		}
		if (autoCreateFreeFormNotes === true || autoCreateFreeFormNotes === false) {
			attributes['auto_create_free_form_notes'] = autoCreateFreeFormNotes;
		}

		if (Object.keys(attributes).length === 0) {
			throw new Error(
				'Provide at least one field to update (template, enabled, or auto_create_free_form_notes).',
			);
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.PATCH,
			path: `/publishing/v2/episodes/${episode}/note_template`,
			body: {
				data: {
					type: 'NoteTemplate',
					attributes,
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Note template update succeeded but no data was returned.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});