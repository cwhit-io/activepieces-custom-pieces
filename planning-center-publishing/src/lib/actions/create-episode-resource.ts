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

export const createEpisodeResourceAction = createAction({
	auth: planningCenterAuth,
	name: 'create_episode_resource',
	displayName: 'Create Episode Resource',
	description:
		'Adds a note, link, or download resource to an episode.',
	audience: 'both',
	aiMetadata: {
		description:
			'Create an episode resource (notes, study guide, link, etc.) on a Publishing episode. Each call creates a new resource.',
		idempotent: false,
	},
	props: {
		episode: planningCenterCommon.episodeDropdown,
		title: Property.ShortText({
			displayName: 'Title',
			description: 'Resource title shown on the episode page.',
			required: true,
		}),
		type: Property.ShortText({
			displayName: 'Resource Type',
			description:
				'Episode resource type as defined by Planning Center (e.g. notes, link).',
			required: true,
		}),
		url: Property.ShortText({
			displayName: 'URL',
			description: 'Link or download URL for the resource.',
			required: false,
		}),
		icon: Property.ShortText({
			displayName: 'Icon',
			description: 'Optional icon identifier for the resource.',
			required: false,
		}),
		position: Property.Number({
			displayName: 'Position',
			description: 'Sort order position for the resource.',
			required: false,
		}),
		featured: Property.Checkbox({
			displayName: 'Featured',
			description: 'Mark this resource as featured on the episode.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			episode,
			title,
			type,
			url,
			icon,
			position,
			featured,
		} = context.propsValue;

		const attributes: Record<string, unknown> = {
			title: title.trim(),
			type: type.trim(),
		};

		if (typeof url === 'string' && url.trim().length > 0) {
			attributes['url'] = url.trim();
		}
		if (typeof icon === 'string' && icon.trim().length > 0) {
			attributes['icon'] = icon.trim();
		}
		if (typeof position === 'number') {
			attributes['position'] = position;
		}
		if (featured === true) {
			attributes['featured'] = true;
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.POST,
			path: `/publishing/v2/episodes/${episode}/episode_resources`,
			body: {
				data: {
					type: 'EpisodeResource',
					attributes,
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Episode resource creation succeeded but no data was returned.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});