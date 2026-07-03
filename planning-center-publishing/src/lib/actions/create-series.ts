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

export const createSeriesAction = createAction({
	auth: planningCenterAuth,
	name: 'create_series',
	displayName: 'Create Series',
	description: 'Creates a new sermon series on a channel.',
	audience: 'both',
	aiMetadata: {
		description:
			'Create a sermon series on a Publishing channel. Each call creates a new series.',
		idempotent: false,
	},
	props: {
		channel: planningCenterCommon.channelDropdown,
		title: Property.ShortText({
			displayName: 'Title',
			description: 'Series title.',
			required: true,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Series description.',
			required: false,
		}),
		published: Property.Checkbox({
			displayName: 'Published',
			description: 'Whether the series is published.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { channel, title, description, published } = context.propsValue;

		const attributes: Record<string, unknown> = {
			title: title.trim(),
		};

		if (typeof description === 'string' && description.length > 0) {
			attributes['description'] = description;
		}
		if (published === true || published === false) {
			attributes['published'] = published;
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.POST,
			path: `/publishing/v2/channels/${channel}/series`,
			body: {
				data: {
					type: 'Series',
					attributes,
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Series creation succeeded but no data was returned.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});