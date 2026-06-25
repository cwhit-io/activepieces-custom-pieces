import { createAction, Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listPlansAction = createAction({
	auth: planningCenterAuth,
	name: 'list_plans',
	displayName: 'List Plans',
	description: 'Lists plans for a service type (upcoming or past service dates).',
	audience: 'both',
	aiMetadata: {
		description:
			'List plans under a service type. Use to find upcoming service dates and plan_id values for scheduling workflows. Optionally filter to future or past plans. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		service_type: planningCenterCommon.serviceTypeDropdown,
		plan_filter: Property.StaticDropdown({
			displayName: 'Plan Filter',
			description:
				'Filter plans by date. Use Future for upcoming services, Past for historical plans.',
			required: false,
			defaultValue: 'all',
			options: {
				options: [
					{ label: 'All Plans', value: 'all' },
					{ label: 'Future Plans', value: 'future' },
					{ label: 'Past Plans', value: 'past' },
				],
			},
		}),
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { service_type, plan_filter, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		const queryParams: Record<string, string> = {
			order: 'sort_date',
		};

		if (plan_filter && plan_filter !== 'all') {
			queryParams['filter'] = plan_filter;
		}

		return await planningCenterClient.listResources({
			credentials,
			path: `/services/v2/service_types/${service_type}/plans`,
			queryParams,
			fetchAll,
		});
	},
});