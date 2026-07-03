import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listEventNotesAction = createAction({
	auth: planningCenterAuth,
	name: 'list_event_notes',
	displayName: 'List Event Notes',
	description: 'Lists leader notes attached to a group event.',
	audience: 'both',
	aiMetadata: {
		description:
			'List notes on a group event for leader communications. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		event: planningCenterCommon.eventDropdown,
		page_size: planningCenterCommon.pageSize,
		max_results: planningCenterCommon.maxResults,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { page_size, max_results, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		const queryParams: Record<string, string> = {};
		if (page_size) {
			queryParams['per_page'] = String(page_size);
		}
		const maxResults = max_results ? Number(max_results) : undefined;

		return await planningCenterClient.listResources({
			credentials,
			path: `/groups/v2/events/${context.propsValue.event}/notes`,
			queryParams,
			fetchAll,
			maxResults,
		});
	},
});