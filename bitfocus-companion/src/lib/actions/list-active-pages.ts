import { createAction } from '@activepieces/pieces-framework';
import { companionAuth } from '../auth';
import { companionClient } from '../common/client';
import { companionCommon } from '../common/props';

export const listActivePagesAction = createAction({
	auth: companionAuth,
	name: 'list_active_pages',
	displayName: 'List Active Pages',
	description:
		'Scans page numbers and returns which pages contain buttons. Page names are not available via the HTTP API.',
	audience: 'both',
	aiMetadata: {
		description:
			'Discover which Companion pages have at least one button in the scanned grid. Returns page numbers and button counts, not page names. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		max_page: companionCommon.scanMaxPage,
		max_row: companionCommon.scanMaxRow,
		max_column: companionCommon.scanMaxColumn,
	},
	async run(context) {
		const { max_page: maxPage, max_row: maxRow, max_column: maxColumn } =
			context.propsValue;
		const connection = companionClient.connectionFromAuth({
			host: context.auth.props.host,
			port: context.auth.props.port,
			satellitePort: context.auth.props.satellite_port,
		});

		const pages = await companionClient.discoverActivePages({
			connection,
			maxPage: maxPage !== undefined ? Number(maxPage) : undefined,
			maxRow: maxRow !== undefined ? Number(maxRow) : undefined,
			maxColumn: maxColumn !== undefined ? Number(maxColumn) : undefined,
		});

		return pages.map((entry) => ({
			page: entry.page,
			button_count: entry.buttonCount,
			label: `Page ${entry.page} (${entry.buttonCount} buttons)`,
		}));
	},
});