import { Property } from '@activepieces/pieces-framework';
import { companionAuth } from '../auth';
import { companionClient } from './client';
import type { CompanionButtonInfo } from './satellite';

function buildNumericOptions({
	start,
	end,
	label,
}: {
	start: number;
	end: number;
	label: string;
}): { label: string; value: string }[] {
	const options: { label: string; value: string }[] = [];

	for (let value = start; value <= end; value += 1) {
		options.push({
			label: `${label} ${value}`,
			value: String(value),
		});
	}

	return options;
}

function formatButtonLabel(button: CompanionButtonInfo): string {
	if (button.text) {
		return `${button.text} (row ${button.row}, col ${button.column})`;
	}
	if (button.type) {
		return `${button.type} (row ${button.row}, col ${button.column})`;
	}
	return `row ${button.row}, col ${button.column}`;
}

const PAGE_OPTIONS = buildNumericOptions({ start: 1, end: 99, label: 'Page' });
const ROW_OPTIONS = buildNumericOptions({ start: 0, end: 31, label: 'Row' });
const COLUMN_OPTIONS = buildNumericOptions({
	start: 0,
	end: 31,
	label: 'Column',
});

export const companionCommon = {
	page: Property.StaticDropdown({
		displayName: 'Page',
		description:
			'Companion button page number (1-based). Use List Active Pages to discover which pages have buttons. Companion does not expose page names over HTTP.',
		required: true,
		defaultValue: '1',
		options: {
			options: PAGE_OPTIONS,
		},
	}),

	selectionMode: Property.StaticDropdown({
		displayName: 'Button Selection',
		description:
			'Pick a button by scanning its on-screen label, or enter row and column manually.',
		required: true,
		defaultValue: 'label',
		options: {
			options: [
				{
					label: 'By button label (scan page)',
					value: 'label',
				},
				{
					label: 'By row and column',
					value: 'coordinates',
				},
			],
		},
	}),

	button: Property.Dropdown({
		displayName: 'Button',
		description:
			'Scans the selected page through the Satellite API. Used when Button Selection is set to label mode.',
		auth: companionAuth,
		required: false,
		refreshers: ['page', 'selection_mode'],
		options: async ({ auth, page, selection_mode: selectionMode }) => {
			if (selectionMode === 'coordinates') {
				return {
					disabled: true,
					options: [],
					placeholder: 'Switch Button Selection to label mode, or use row and column.',
				};
			}

			if (!auth?.props.host || !page) {
				return {
					disabled: true,
					options: [],
				};
			}

			try {
				const connection = companionClient.connectionFromAuth({
					host: auth.props.host,
					port: auth.props.port,
					satellitePort: auth.props.satellite_port,
				});
				const buttons = await companionClient.listButtonsOnPage({
					connection,
					page: Number(page),
					maxRow: 15,
					maxColumn: 15,
				});

				if (buttons.length === 0) {
					return {
						disabled: true,
						options: [],
						placeholder:
							'No labeled buttons found on this page in the scanned grid (rows 0-15, columns 0-15).',
					};
				}

				return {
					options: buttons.map((button) => ({
						label: formatButtonLabel(button),
						value: `${button.row}:${button.column}`,
					})),
				};
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: 'Failed to scan buttons from Companion.';
				return {
					disabled: true,
					options: [],
					placeholder: message,
				};
			}
		},
	}),

	row: Property.StaticDropdown({
		displayName: 'Row',
		description:
			'Button row on the page (0-based). Used when Button Selection is set to row and column.',
		required: false,
		defaultValue: '0',
		options: {
			options: ROW_OPTIONS,
		},
	}),

	column: Property.StaticDropdown({
		displayName: 'Column',
		description:
			'Button column on the page (0-based). Used when Button Selection is set to row and column.',
		required: false,
		defaultValue: '0',
		options: {
			options: COLUMN_OPTIONS,
		},
	}),

	buttonAction: Property.StaticDropdown({
		displayName: 'Action',
		description:
			'Press & Release runs both down and up actions. Press holds the button until you release it separately.',
		required: true,
		defaultValue: 'press_and_release',
		options: {
			options: [
				{
					label: 'Press & Release',
					value: 'press_and_release',
				},
				{
					label: 'Press',
					value: 'press',
				},
				{
					label: 'Release',
					value: 'release',
				},
			],
		},
	}),

	scanMaxRow: Property.StaticDropdown({
		displayName: 'Max Row to Scan',
		description: 'Highest row index to scan when listing buttons (0-based).',
		required: false,
		defaultValue: '15',
		options: {
			options: ROW_OPTIONS,
		},
	}),

	scanMaxColumn: Property.StaticDropdown({
		displayName: 'Max Column to Scan',
		description: 'Highest column index to scan when listing buttons (0-based).',
		required: false,
		defaultValue: '15',
		options: {
			options: COLUMN_OPTIONS,
		},
	}),

	scanMaxPage: Property.StaticDropdown({
		displayName: 'Max Page to Scan',
		description: 'Highest page number to check when discovering active pages.',
		required: false,
		defaultValue: '20',
		options: {
			options: PAGE_OPTIONS.slice(0, 20),
		},
	}),
};