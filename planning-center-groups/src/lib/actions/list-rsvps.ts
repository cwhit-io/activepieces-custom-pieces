import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon, planningCenterListOptions } from '../common/props';

export const listRsvpsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_rsvps',
	displayName: 'List RSVPs',
	description: 'Lists RSVP responses for a group event.',
	audience: 'both',
	aiMetadata: {
		description:
			'List RSVP records for a group event (yes, no, maybe, awaiting_response). Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		event: planningCenterCommon.eventDropdown,
		sort_direction: planningCenterCommon.sortDirection,
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
			sortField: 'response',
			dateField: 'response',
		});

		return await planningCenterClient.listResources({
			credentials,
			path: `/groups/v2/events/${context.propsValue.event}/rsvps`,
			...listOptions,
		});
	},
});