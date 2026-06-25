import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import { planningCenterClient } from '../common/client';
import { planningCenterCommon } from '../common/props';

export const listSpeakersAction = createAction({
	auth: planningCenterAuth,
	name: 'list_speakers',
	displayName: 'List Speakers',
	description: 'Lists speakers.',
	audience: 'both',
	aiMetadata: {
		description: 'List Publishing speakers. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		fetch_all_pages: planningCenterCommon.fetchAllPages,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const fetchAll = context.propsValue.fetch_all_pages ?? true;

		return await planningCenterClient.listResources({
			credentials,
			path: '/publishing/v2/speakers',
			
			fetchAll,
		});
	},
});
