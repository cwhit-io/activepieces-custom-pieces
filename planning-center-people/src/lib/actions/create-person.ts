import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';

type JsonApiSingleResponse = {
	data?: {
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	};
};

export const createPersonAction = createAction({
	auth: planningCenterAuth,
	name: 'create_person',
	displayName: 'Create Person',
	description: 'Creates a new person profile in Planning Center People.',
	audience: 'both',
	aiMetadata: {
		description:
			'Create a person via POST /people. Each call creates a new profile; retries may duplicate. Use List People first to avoid duplicates.',
		idempotent: false,
	},
	props: {
		first_name: Property.ShortText({
			displayName: 'First Name',
			description: 'The person\'s first name.',
			required: true,
		}),
		last_name: Property.ShortText({
			displayName: 'Last Name',
			description: 'The person\'s last name.',
			required: true,
		}),
		gender: Property.StaticDropdown({
			displayName: 'Gender',
			description: 'Optional. The person\'s gender.',
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
			description: 'Optional. Birth date (ISO 8601).',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Optional. Profile status.',
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
			description: 'Optional. Membership status label (e.g. Member, Regular Attender).',
			required: false,
		}),
		primary_campus_id: Property.ShortText({
			displayName: 'Primary Campus ID',
			description: 'Optional. Campus ID to assign as primary campus.',
			required: false,
		}),
		child: Property.Checkbox({
			displayName: 'Child',
			description: 'Optional. Mark this person as a child profile.',
			required: false,
		}),
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const {
			first_name: firstName,
			last_name: lastName,
			gender,
			birthdate,
			status,
			membership,
			primary_campus_id: primaryCampusId,
			child,
		} = context.propsValue;

		const attributes: Record<string, unknown> = {
			first_name: firstName.trim(),
			last_name: lastName.trim(),
		};

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

		const response = await planningCenterClient.apiCall<JsonApiSingleResponse>({
			credentials,
			method: HttpMethod.POST,
			path: '/people/v2/people',
			body: {
				data: {
					type: 'Person',
					attributes,
				},
			},
		});

		if (!response.body.data) {
			throw new Error('Failed to create person.');
		}

		return planningCenterClient.flattenJsonApiResource(response.body.data);
	},
});