import { createAction } from '@activepieces/pieces-framework';
import { companionAuth } from '../auth';
import { companionClient } from '../common/client';
import { companionCommon } from '../common/props';

function resolveButtonCoordinates({
	selectionMode,
	button,
	row,
	column,
}: {
	selectionMode?: string;
	button?: string;
	row?: string;
	column?: string;
}): { row: number; column: number } {
	if (selectionMode === 'coordinates') {
		return {
			row: Number(row ?? 0),
			column: Number(column ?? 0),
		};
	}

	if (typeof button !== 'string' || !button.includes(':')) {
		throw new Error('Select a button from the scanned list, or switch to row and column mode.');
	}

	const [rowValue, columnValue] = button.split(':');
	return {
		row: Number(rowValue),
		column: Number(columnValue),
	};
}

function resolveHttpCommand(
	action?: string,
): 'down' | 'up' | 'press' {
	switch (action) {
		case 'press':
			return 'down';
		case 'release':
			return 'up';
		case 'press_and_release':
			return 'press';
		default:
			return 'press';
	}
}

export const triggerButtonAction = createAction({
	auth: companionAuth,
	name: 'trigger_button',
	displayName: 'Trigger Button',
	description:
		'Press, release, or press-and-release a Companion button by label or grid location.',
	audience: 'both',
	aiMetadata: {
		description:
			'Trigger a Bitfocus Companion button on a page. Choose Press & Release for a normal tap, Press to hold, or Release to let go. Pick the button by scanned label or by row/column. Not idempotent — retries may re-trigger button actions.',
		idempotent: false,
	},
	props: {
		page: companionCommon.page,
		selection_mode: companionCommon.selectionMode,
		button: companionCommon.button,
		row: companionCommon.row,
		column: companionCommon.column,
		action: companionCommon.buttonAction,
	},
	async run(context) {
		const {
			page,
			selection_mode: selectionMode,
			button,
			row,
			column,
			action,
		} = context.propsValue;
		const pageNumber = Number(page);
		const coordinates = resolveButtonCoordinates({
			selectionMode,
			button,
			row,
			column,
		});
		const { row: rowNumber, column: columnNumber } = coordinates;
		const httpCommand = resolveHttpCommand(action);

		const response = await companionClient.sendLocationCommand({
			connection: {
				host: context.auth.props.host,
				port: context.auth.props.port,
			},
			page: pageNumber,
			row: rowNumber,
			column: columnNumber,
			command: httpCommand,
		});

		return {
			page: pageNumber,
			row: rowNumber,
			column: columnNumber,
			action: action ?? 'press_and_release',
			http_command: httpCommand,
			status: response.status,
		};
	},
});