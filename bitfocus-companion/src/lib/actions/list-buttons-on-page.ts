import { createAction } from '@activepieces/pieces-framework';
import { companionAuth } from '../auth';
import { companionClient } from '../common/client';
import { companionCommon } from '../common/props';

export const listButtonsOnPageAction = createAction({
	auth: companionAuth,
	name: 'list_buttons_on_page',
	displayName: 'List Buttons on Page',
	description:
		'Scans a Companion page and returns button labels with row/column locations.',
	audience: 'both',
	aiMetadata: {
		description:
			'Discover buttons on a Companion page using the Satellite API. Returns each button text label (when set), type, row, and column. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		page: companionCommon.page,
		max_row: companionCommon.scanMaxRow,
		max_column: companionCommon.scanMaxColumn,
	},
	async run(context) {
		const { page, max_row: maxRow, max_column: maxColumn } = context.propsValue;
		const connection = companionClient.connectionFromAuth({
			host: context.auth.props.host,
			port: context.auth.props.port,
			satellitePort: context.auth.props.satellite_port,
		});

		const buttons = await companionClient.listButtonsOnPage({
			connection,
			page: Number(page),
			maxRow: maxRow !== undefined ? Number(maxRow) : undefined,
			maxColumn: maxColumn !== undefined ? Number(maxColumn) : undefined,
		});

		return buttons.map((button) => ({
			page: button.page,
			row: button.row,
			column: button.column,
			text: button.text,
			type: button.type,
			label:
				button.text ??
				(button.type ? `${button.type} @ ${button.row}/${button.column}` : null),
		}));
	},
});