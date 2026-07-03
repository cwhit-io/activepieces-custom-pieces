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

export const updateEpisodeResourceAction = createAction({
	auth: planningCenterAuth,
	name: 'update_episode_resource',
	displayName: 'Update Episode Resource',
	description:
		'Updates a note, link, or download resource on an episode.',
	audience: 'both',
	aiMetadata: {
		description:
			'Patch an episode resource title, URL, position, or featured flag. Provide at least one field to change.',
		idempotent: true,
	},
	props: {
		episode: planningCenterCommon.episodeDropdown,
		episode_resource_id: Property.ShortText({
			displayName: 'Episode Resource ID',
			description:
				'Episode resource ID (from List Episode Resources).',
			required: true,
		}),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'New resource title. Leave empty to keep unchanged.',
			required: false,
		}),
		type: Property.ShortText({
			displayName: 'Resource Type',
			description: 'New resource type. Leave empty to keep unchanged.',
			required: false,
		}),
		url: Property.ShortText({
			displayName: 'URL',
			description: 'New URL. Leave empty to keep unchanged.',
			required: false,
		}),
		icon: Property.ShortText({
			displayName: 'Icon',
			description: 'New icon. Leave empty to keep unchanged.',
			required: false,
		}),
		position: Property.Number({
			displayName: 'Position',
			description: 'New sort position. Leave empty to keep unchanged.',
			required: false,
		}),
		featured: Property.Checkbox({
			displayName: 'Featured',
			description: 'Set whether this resource is featured.',
			required: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			episode,
			episode_resource_id: episodeResourceId,
			title,
			type,
			url,
			icon,
			position,
			featured,
		} = context.propsValue;

		const attributes: Record<string, unknown> = {};

		if (typeof title === 'string' && title.trim().length > 0) {
			attributes['title'] = title.trim();
		}
		if (typeof type === 'string' && type.trim().length > 0) {
			attributes['type'] = type.trim();
		}
		if (typeof url === 'string' && url.trim().length > 0) {
			attributes['url'] = url.trim();
		}
		if (typeof icon === 'string' && icon.trim().length > 0) {
			attributes['icon'] = icon.trim();
		}
		if (typeof position === 'number') {
			attributes['position'] = position;
		}
		if (featured === true || featured === false) {
			attributes['featured'] = featured;
		}

		if (Object.keys(attributes).length === 0) {
			throw new Error(
				'Provide at least one field to update (title, URL, position, featured, etc.).',
			);
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.PATCH,
			path: `/publishing/v2/episodes/${episode}/episode_resources/${episodeResourceId.trim()}`,
			body: {
				data: {
					type: 'EpisodeResource',
					attributes,
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Episode resource update succeeded but no data was returned.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});