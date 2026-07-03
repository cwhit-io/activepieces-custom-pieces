import { createAction, Property } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

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
		sort_direction: planningCenterCommon.sortDirection,
		start_date: planningCenterCommon.startDate,
		end_date: planningCenterCommon.endDate,
		page_size: planningCenterCommon.pageSize,
		max_results: planningCenterCommon.maxResults,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { service_type, plan_filter, sort_direction } = context.propsValue;
		const listOptions = planningCenterListOptions({
			props: context.propsValue,
			sortField: 'sort_date',
			dateField: 'sort_date',
		});

		delete listOptions.queryParams['where[sort_date][gte]'];
		delete listOptions.queryParams['where[sort_date][lte]'];

		if (plan_filter && plan_filter !== 'all') {
			listOptions.queryParams['filter'] = plan_filter;
		} else if (listOptions.clientFilters.startDate) {
			listOptions.queryParams['filter'] = 'after';
			listOptions.queryParams['after'] = listOptions.clientFilters.startDate;
		} else if (listOptions.clientFilters.endDate) {
			listOptions.queryParams['filter'] = 'before';
			listOptions.queryParams['before'] = listOptions.clientFilters.endDate;
		}

		if (!sort_direction && !listOptions.queryParams['order']) {
			listOptions.queryParams['order'] = 'sort_date';
		}

		return await planningCenterClient.listResources({
			credentials,
			path: `/services/v2/service_types/${context.propsValue.service_type}/plans`,
			...listOptions,
		});
	},
});