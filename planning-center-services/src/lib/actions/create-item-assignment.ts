import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const createItemAssignmentAction = createAction({
	auth: planningCenterAuth,
	name: 'create_item_assignment',
	displayName: 'Create Item Assignment',
	description:
		'Assigns a person or team position to a plan item.',
	audience: 'both',
	aiMetadata: {
		description:
			'Create an item assignment on a plan item via POST. Assign a musician (Person) or position (TeamPosition) to a song or setlist item. Each call creates a new assignment; retries may duplicate.',
		idempotent: false,
	},
	props: {
		service_type: planningCenterCommon.serviceTypeDropdown,
		plan: planningCenterCommon.planDropdown,
		plan_item: planningCenterCommon.planItemDropdown,
		assignable_type: Property.StaticDropdown({
			displayName: 'Assignable Type',
			description: 'Whether to assign a person or a team position.',
			required: true,
			options: {
				options: [
					{ label: 'Person', value: 'Person' },
					{ label: 'Team Position', value: 'TeamPosition' },
				],
			},
		}),
		person_search: planningCenterCommon.personSearch,
		person: planningCenterCommon.personDropdownOptional,
		team: planningCenterCommon.teamDropdown,
		team_position: planningCenterCommon.teamPositionDropdown,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			service_type: serviceType,
			plan,
			plan_item: planItem,
			assignable_type: assignableType,
			person,
			team_position: teamPosition,
		} = context.propsValue;

		let assignableId: string | undefined;
		if (assignableType === 'Person') {
			if (typeof person !== 'string' || person.length === 0) {
				throw new Error('Person is required when assignable type is Person.');
			}
			assignableId = person;
		} else if (assignableType === 'TeamPosition') {
			if (typeof teamPosition !== 'string' || teamPosition.length === 0) {
				throw new Error(
					'Team position is required when assignable type is Team Position.',
				);
			}
			assignableId = teamPosition;
		} else {
			throw new Error('Assignable type must be Person or TeamPosition.');
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.POST,
			path: `/services/v2/service_types/${serviceType}/plans/${plan}/items/${planItem}/item_assignments`,
			body: {
				data: {
					type: 'ItemAssignment',
					attributes: {
						assignable_type: assignableType,
						assignable_id: assignableId,
					},
					relationships: {
						assignable: {
							data: {
								type: assignableType,
								id: assignableId,
							},
						},
					},
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Failed to create item assignment.');
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