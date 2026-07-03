import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

type JsonApiResource = {
	type: string;
	id: string;
	attributes?: Record<string, unknown>;
};

type JsonApiEpisodeResponse = {
	data?: JsonApiResource;
	included?: JsonApiResource[];
};

export const createSpeakershipAction = createAction({
	auth: planningCenterAuth,
	name: 'create_speakership',
	displayName: 'Create Speakership',
	description:
		'Attaches a speaker to an episode via the episode PATCH included payload.',
	audience: 'both',
	aiMetadata: {
		description:
			'Attach a speaker to a Publishing episode by patching the episode with an included Speakership resource. Each call adds a speaker assignment.',
		idempotent: false,
	},
	props: {
		episode: planningCenterCommon.episodeDropdown,
		speaker: planningCenterCommon.speakerDropdown,
		speaker_type: Property.ShortText({
			displayName: 'Speaker Type',
			description:
				'Optional speaker role/type as accepted by Planning Center (e.g. primary, guest).',
			required: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { episode, speaker, speaker_type: speakerType } = context.propsValue;

		const speakershipAttributes: Record<string, unknown> = {};
		if (typeof speakerType === 'string' && speakerType.trim().length > 0) {
			speakershipAttributes['speaker_type'] = speakerType.trim();
		}

		const response = await planningCenterClient.apiCall<JsonApiEpisodeResponse>({
			credentials,
			method: HttpMethod.PATCH,
			path: `/publishing/v2/episodes/${episode}`,
			body: {
				data: {
					type: 'Episode',
					id: episode,
				},
				included: [
					{
						type: 'Speakership',
						attributes: speakershipAttributes,
						relationships: {
							speaker: {
								data: {
									type: 'Speaker',
									id: speaker,
								},
							},
						},
					},
				],
			},
		});

		const included = response.body.included ?? [];
		const createdSpeakership = included.find(
			(resource) => resource.type === 'Speakership',
		);

		if (createdSpeakership) {
			return planningCenterClient.flattenJsonApiResource(createdSpeakership);
		}

		const speakerships = await planningCenterClient.listResources({
			credentials,
			path: `/publishing/v2/episodes/${episode}/speakerships`,
			fetchAll: true,
		});

		const matchingSpeakership = speakerships.find(
			(item) => item['speaker_id'] === speaker,
		);

		if (matchingSpeakership) {
			return matchingSpeakership;
		}

		if (response.body.data) {
			return {
				episode: planningCenterClient.flattenJsonApiResource(response.body.data),
				included,
			};
		}

		throw new Error('Speakership creation succeeded but no speakership was returned.');
	},
});