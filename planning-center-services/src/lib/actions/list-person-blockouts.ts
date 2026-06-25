import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listPersonBlockoutsAction = createAction({
	auth: planningCenterAuth,
	name: 'list_person_blockouts',
	displayName: 'List Person Blockouts',
	description:
		'Lists dates when a person cannot be scheduled (availability blockouts).',
	audience: 'both',
	aiMetadata: {
		description:
			'List blockouts for a person from the People API. Use before auto-scheduling to avoid conflicts when a volunteer is unavailable. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		person_search: planningCenterCommon.personSearch,
		person: planningCenterCommon.personDropdown,
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { person, fetch_all_pages } = context.propsValue;
		const fetchAll = fetch_all_pages ?? true;

		return await planningCenterClient.listResources({
			credentials,
			path: `/people/v2/people/${person}/blockouts`,
			fetchAll,
		});
	},
});