import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const createNeededPositionAction = createAction({
	auth: planningCenterAuth,
	name: 'create_needed_position',
	displayName: 'Create Needed Position',
	description: 'Opens a volunteer slot on a plan before autoscheduling.',
	audience: 'both',
	aiMetadata: {
		description:
			'Create a needed position on a plan via POST. Open a slot for a team position before running autoschedule. Each call creates a new slot; retries may duplicate.',
		idempotent: false,
	},
	props: {
		service_type: planningCenterCommon.serviceTypeDropdown,
		plan: planningCenterCommon.planDropdown,
		team: planningCenterCommon.teamDropdown,
		team_position: planningCenterCommon.teamPositionDropdown,
		quantity: Property.Number({
			displayName: 'Quantity',
			description: 'Number of open positions needed (default 1).',
			required: false,
			defaultValue: 1,
		}),
		plan_time: planningCenterCommon.planTimeDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			service_type: serviceType,
			plan,
			team,
			team_position: teamPosition,
			quantity,
			plan_time: planTime,
		} = context.propsValue;

		const attributes: Record<string, unknown> = {
			quantity: quantity ?? 1,
			team_id: team,
		};
		if (typeof teamPosition === 'string' && teamPosition.length > 0) {
			attributes['team_position_id'] = teamPosition;
		}

		const relationships: Record<string, unknown> = {};
		if (typeof planTime === 'string' && planTime.length > 0) {
			relationships['time'] = {
				data: {
					type: 'PlanTime',
					id: planTime,
				},
			};
			attributes['time_id'] = planTime;
		}

		const body: NeededPositionCreateBody = {
			data: {
				type: 'NeededPosition',
				attributes,
			},
		};
		if (Object.keys(relationships).length > 0) {
			body.data.relationships = relationships;
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.POST,
			path: `/services/v2/service_types/${serviceType}/plans/${plan}/needed_positions`,
			body,
		});

		if (!response.body.data) {
			throw new Error('Failed to create needed position.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});

type NeededPositionCreateBody = {
	data: {
		type: string;
		attributes: Record<string, unknown>;
		relationships?: Record<string, unknown>;
	};
};

type JsonApiSingleResponse = {
	data?: {
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	};
};