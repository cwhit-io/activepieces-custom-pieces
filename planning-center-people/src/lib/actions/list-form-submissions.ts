import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

export const listFormSubmissionsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_form_submissions',
	displayName: 'List Form Submissions',
	description: 'Lists submissions for a Planning Center form.',
	audience: 'both',
	aiMetadata: {
		description:
			'List form submissions for a specific form. Use to process inbound form data. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		form: planningCenterCommon.formDropdown,
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
		const listOptions = planningCenterListOptions({
			props: context.propsValue,
			sortField: 'created_at',
			dateField: 'created_at',
		});

		return await planningCenterClient.listResources({
			credentials,
			path: `/people/v2/forms/${context.propsValue.form}/form_submissions`,
			...listOptions,
		});
	},
});