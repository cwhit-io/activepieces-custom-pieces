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

export const createHouseholdMembershipAction = createAction({
	auth: planningCenterAuth,
	name: 'create_household_membership',
	displayName: 'Create Household Membership',
	description: 'Links a person to a household with a role.',
	audience: 'both',
	aiMetadata: {
		description:
			'Add a person to a household via POST /households/{id}/household_memberships. Each call creates a new membership; retries may duplicate.',
		idempotent: false,
	},
	props: {
		household: planningCenterCommon.householdDropdown,
		person_search: planningCenterCommon.personSearch,
		person: planningCenterCommon.personDropdown,
		household_role: Property.StaticDropdown({
			displayName: 'Household Role',
			description: 'The person\'s role within the household.',
			required: true,
			options: {
				options: [
					{ label: 'Adult', value: 'adult' },
					{ label: 'Child or Dependent', value: 'child_or_dependent' },
					{ label: 'Other Adult', value: 'other_adult' },
					{ label: 'Parent / Guardian', value: 'parent_guardian' },
				],
			},
		}),
		pending: Property.Checkbox({
			displayName: 'Pending',
			description:
				'Mark membership as pending (unverified). Leave unchecked for verified membership.',
			required: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { household, person, household_role: householdRole, pending } =
			context.propsValue;

		const attributes: Record<string, unknown> = {
			household_role: householdRole,
			person_id: person,
		};
		if (pending === true) {
			attributes['pending'] = true;
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.POST,
			path: `/people/v2/households/${household}/household_memberships`,
			body: {
				data: {
					type: 'HouseholdMembership',
					attributes,
					relationships: {
						person: {
							data: {
								type: 'Person',
								id: person,
							},
						},
					},
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Failed to create household membership.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});