import dayjs from 'dayjs';
import timezonePlugin from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

export type DateFilterPreset = 'none' | 'today' | 'latest_sunday' | 'custom';

function normalizePcoDate({
	value,
	bound,
}: {
	value: string;
	bound: 'start' | 'end';
}): string {
	const trimmed = value.trim();
	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
		return bound === 'start'
			? `${trimmed}T00:00:00Z`
			: `${trimmed}T23:59:59.999Z`;
	}
	if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(trimmed)) {
		return `${trimmed}Z`;
	}
	return trimmed;
}

function resolveTimeZone(timeZone?: string): string {
	const trimmed = timeZone?.trim();
	return trimmed && trimmed.length > 0 ? trimmed : 'America/Chicago';
}

function resolveLatestSunday({
	reference,
	timeZone,
}: {
	reference: dayjs.Dayjs;
	timeZone: string;
}): dayjs.Dayjs {
	const local = reference.tz(timeZone);
	if (local.day() === 0) {
		return local.startOf('day');
	}
	return local.subtract(local.day(), 'day').startOf('day');
}

function toUtcIsoRange({
	start,
	end,
}: {
	start: dayjs.Dayjs;
	end: dayjs.Dayjs;
}): { startDate: string; endDate: string } {
	return {
		startDate: start.utc().format(),
		endDate: end.utc().format(),
	};
}

export function resolveDateRangeFromPreset({
	preset,
	timeZone,
	startDate,
	endDate,
}: {
	preset?: string;
	timeZone?: string;
	startDate?: string;
	endDate?: string;
}): {
	startDate?: string;
	endDate?: string;
	resolvedLabel?: string;
} {
	const tz = resolveTimeZone(timeZone);
	const now = dayjs().tz(tz);

	switch (preset) {
		case 'today': {
			const range = toUtcIsoRange({
				start: now.startOf('day'),
				end: now.endOf('day'),
			});
			return {
				...range,
				resolvedLabel: `Today (${now.format('YYYY-MM-DD')})`,
			};
		}
		case 'latest_sunday': {
			const sunday = resolveLatestSunday({ reference: now, timeZone: tz });
			const range = toUtcIsoRange({
				start: sunday.startOf('day'),
				end: sunday.endOf('day'),
			});
			return {
				...range,
				resolvedLabel: `Latest Sunday (${sunday.format('YYYY-MM-DD')})`,
			};
		}
		case 'custom': {
			return {
				startDate: startDate
					? normalizePcoDate({ value: startDate, bound: 'start' })
					: undefined,
				endDate: endDate
					? normalizePcoDate({ value: endDate, bound: 'end' })
					: undefined,
			};
		}
		default:
			return {};
	}
}

export function resolveLatestSundayDate({
	timeZone,
}: {
	timeZone?: string;
}): {
	sundayDate: string;
	startIso: string;
	endIso: string;
} {
	const tz = resolveTimeZone(timeZone);
	const sunday = resolveLatestSunday({
		reference: dayjs().tz(tz),
		timeZone: tz,
	});
	const range = toUtcIsoRange({
		start: sunday.startOf('day'),
		end: sunday.endOf('day'),
	});
	return {
		sundayDate: sunday.format('YYYY-MM-DD'),
		startIso: range.startDate,
		endIso: range.endDate,
	};
}

export function isSameCalendarDay({
	isoTimestamp,
	targetDay,
	timeZone,
}: {
	isoTimestamp: string;
	targetDay: string;
	timeZone?: string;
}): boolean {
	const tz = resolveTimeZone(timeZone);
	return (
		dayjs(isoTimestamp).tz(tz).format('YYYY-MM-DD') === targetDay
	);
}

export const planningCenterDates = {
	resolveDateRangeFromPreset,
	resolveLatestSundayDate,
	isSameCalendarDay,
};