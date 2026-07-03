import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const createPersonBlockoutAction = createAction({
	auth: planningCenterAuth,
	name: 'create_person_blockout',
	displayName: 'Create Person Blockout',
	description: 'Marks dates when a person cannot be scheduled.',
	audience: 'both',
	aiMetadata: {
		description:
			'Create a blockout for a person via POST. Mark unavailable dates before scheduling or autoschedule. Each call creates a new blockout; retries may duplicate.',
		idempotent: false,
	},
	props: {
		person_search: planningCenterCommon.personSearch,
		person: planningCenterCommon.personDropdown,
		starts_at: Property.DateTime({
			displayName: 'Starts At',
			description:
				'When the blockout begins (ISO 8601, e.g. 2026-06-25T00:00:00Z).',
			required: true,
		}),
		ends_at: Property.DateTime({
			displayName: 'Ends At',
			description:
				'When the blockout ends (ISO 8601, e.g. 2026-06-25T23:59:59Z).',
			required: true,
		}),
		reason: Property.ShortText({
			displayName: 'Reason',
			description: 'Optional reason for the blockout.',
			required: false,
		}),
		repeat_period: Property.StaticDropdown({
			displayName: 'Repeat Period',
			description: 'Optional recurrence period. Leave empty for a one-time blockout.',
			required: false,
			options: {
				options: [
					{ label: 'Daily', value: 'daily' },
					{ label: 'Weekly', value: 'weekly' },
					{ label: 'Monthly', value: 'monthly' },
					{ label: 'Yearly', value: 'yearly' },
				],
			},
		}),
		repeat_frequency: Property.StaticDropdown({
			displayName: 'Repeat Frequency',
			description:
				'Optional. How often the blockout repeats (e.g. every_1 = every period).',
			required: false,
			options: {
				options: [
					{ label: 'No Repeat', value: 'no_repeat' },
					{ label: 'Every 1', value: 'every_1' },
					{ label: 'Every 2', value: 'every_2' },
					{ label: 'Every 3', value: 'every_3' },
					{ label: 'Every 4', value: 'every_4' },
				],
			},
		}),
		repeat_until: Property.DateTime({
			displayName: 'Repeat Until',
			description: 'Optional end date for recurring blockouts.',
			required: false,
		}),
		share: Property.Checkbox({
			displayName: 'Share',
			description:
				'When enabled, shares the blockout with the organization.',
			required: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			person,
			starts_at: startsAt,
			ends_at: endsAt,
			reason,
			repeat_period: repeatPeriod,
			repeat_frequency: repeatFrequency,
			repeat_until: repeatUntil,
			share,
		} = context.propsValue;

		const attributes: Record<string, unknown> = {
			starts_at: startsAt,
			ends_at: endsAt,
		};
		if (typeof reason === 'string' && reason.trim().length > 0) {
			attributes['reason'] = reason.trim();
		}
		if (typeof repeatPeriod === 'string' && repeatPeriod.length > 0) {
			attributes['repeat_period'] = repeatPeriod;
		}
		if (typeof repeatFrequency === 'string' && repeatFrequency.length > 0) {
			attributes['repeat_frequency'] = repeatFrequency;
		}
		if (typeof repeatUntil === 'string' && repeatUntil.length > 0) {
			attributes['repeat_until'] = repeatUntil;
		}
		if (typeof share === 'boolean') {
			attributes['share'] = share;
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.POST,
			path: `/services/v2/people/${person}/blockouts`,
			body: {
				data: {
					type: 'Blockout',
					attributes,
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Failed to create person blockout.');
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