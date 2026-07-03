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

export const updatePersonAction = createAction({
	auth: planningCenterAuth,
	name: 'update_person',
	displayName: 'Update Person',
	description: 'Updates an existing person profile (name, status, campus, etc.).',
	audience: 'both',
	aiMetadata: {
		description:
			'Patch a person profile via PATCH /people/{id}. Provide at least one field to change. Safe to retry with the same values.',
		idempotent: true,
	},
	props: {
		person: planningCenterCommon.personDropdown,
		first_name: Property.ShortText({
			displayName: 'First Name',
			description: 'New first name. Leave empty to keep unchanged.',
			required: false,
		}),
		last_name: Property.ShortText({
			displayName: 'Last Name',
			description: 'New last name. Leave empty to keep unchanged.',
			required: false,
		}),
		gender: Property.StaticDropdown({
			displayName: 'Gender',
			description: 'New gender. Leave empty to keep unchanged.',
			required: false,
			options: {
				options: [
					{ label: 'Male', value: 'Male' },
					{ label: 'Female', value: 'Female' },
				],
			},
		}),
		birthdate: Property.DateTime({
			displayName: 'Birthdate',
			description: 'New birthdate (ISO 8601). Leave empty to keep unchanged.',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'New profile status. Leave empty to keep unchanged.',
			required: false,
			options: {
				options: [
					{ label: 'Active', value: 'active' },
					{ label: 'Inactive', value: 'inactive' },
				],
			},
		}),
		membership: Property.ShortText({
			displayName: 'Membership',
			description: 'New membership label. Leave empty to keep unchanged.',
			required: false,
		}),
		primary_campus_id: Property.ShortText({
			displayName: 'Primary Campus ID',
			description: 'New primary campus ID. Leave empty to keep unchanged.',
			required: false,
		}),
		child: Property.Checkbox({
			displayName: 'Child',
			description: 'Mark as child profile. Leave unchecked to keep unchanged.',
			required: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			person,
			first_name: firstName,
			last_name: lastName,
			gender,
			birthdate,
			status,
			membership,
			primary_campus_id: primaryCampusId,
			child,
		} = context.propsValue;

		const attributes: Record<string, unknown> = {};

		if (typeof firstName === 'string' && firstName.trim().length > 0) {
			attributes['first_name'] = firstName.trim();
		}
		if (typeof lastName === 'string' && lastName.trim().length > 0) {
			attributes['last_name'] = lastName.trim();
		}
		if (typeof gender === 'string' && gender.length > 0) {
			attributes['gender'] = gender;
		}
		if (typeof birthdate === 'string' && birthdate.length > 0) {
			attributes['birthdate'] = birthdate;
		}
		if (typeof status === 'string' && status.length > 0) {
			attributes['status'] = status;
		}
		if (typeof membership === 'string' && membership.trim().length > 0) {
			attributes['membership'] = membership.trim();
		}
		if (typeof primaryCampusId === 'string' && primaryCampusId.trim().length > 0) {
			attributes['primary_campus_id'] = primaryCampusId.trim();
		}
		if (child === true) {
			attributes['child'] = true;
		}

		if (Object.keys(attributes).length === 0) {
			throw new Error(
				'Provide at least one field to update (first name, last name, status, etc.).',
			);
		}

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.PATCH,
			path: `/people/v2/people/${person}`,
			body: {
				data: {
					type: 'Person',
					attributes,
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Person update succeeded but no data was returned.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});