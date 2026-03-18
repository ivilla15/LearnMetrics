import { addDays, addMinutes } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export const TZ = 'America/Los_Angeles' as const;

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

function isWeekday(value: string): value is Weekday {
  return (WEEKDAYS as readonly string[]).includes(value);
}

export function scheduleRunsOnDate(params: { date: Date; days: string[]; tz?: string }) {
  const { date, days, tz = TZ } = params;

  const inTz = toZonedTime(date, tz);
  const dayName = WEEKDAYS[inTz.getDay()];

  return Array.isArray(days) && days.includes(dayName);
}

export function getNextScheduledDateForSchedule(
  base: Date = new Date(),
  days: string[],
  tz: string = TZ,
): string {
  if (!Array.isArray(days) || days.length === 0) {
    throw new Error('Schedule must include at least one day');
  }

  for (const d of days) {
    if (!isWeekday(d)) {
      throw new Error(`Invalid weekday "${d}". Expected full names like "Monday".`);
    }
  }

  const baseLocalDate = formatInTimeZone(base, tz, 'yyyy-MM-dd');
  const startUtc = fromZonedTime(`${baseLocalDate} 00:00`, tz);

  for (let i = 0; i < 7; i++) {
    const candidateUtc = addDays(startUtc, i);
    const dayName = formatInTimeZone(candidateUtc, tz, 'EEEE');
    if (days.includes(dayName)) {
      return formatInTimeZone(candidateUtc, tz, 'yyyy-MM-dd');
    }
  }

  throw new Error('Could not resolve next scheduled date');
}

export function getNextScheduledDate(base: Date = new Date(), tz: string = TZ): string {
  return getNextScheduledDateForSchedule(base, ['Friday'], tz);
}

export function localDateTimeToUtcRange(params: {
  localDate: string;
  localTime: string;
  windowMinutes: number;
  tz?: string;
}) {
  const { localDate, localTime, windowMinutes, tz = TZ } = params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
    throw new Error('Invalid localDate format (expected YYYY-MM-DD)');
  }
  if (!/^\d{2}:\d{2}$/.test(localTime)) {
    throw new Error('Invalid localTime format (expected HH:mm)');
  }

  const combined = `${localDate} ${localTime}`;

  const opensAtUTC = fromZonedTime(combined, tz);
  const closesAtUTC = addMinutes(opensAtUTC, windowMinutes);

  const opensAtLocalISO = formatInTimeZone(opensAtUTC, tz, "yyyy-MM-dd'T'HH:mm:ssXXX");
  const closesAtLocalISO = formatInTimeZone(closesAtUTC, tz, "yyyy-MM-dd'T'HH:mm:ssXXX");

  return { opensAtUTC, closesAtUTC, opensAtLocalISO, closesAtLocalISO };
}

export function expiresAtFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function isoDay(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return 'invalid';
  return date.toISOString().slice(0, 10);
}

export function formatTimeAmPm(hhmm: string) {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;

  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function localDayToUtcDate(localDate: string, tz: string): Date {
  const { opensAtUTC } = localDateTimeToUtcRange({
    localDate,
    localTime: '00:00',
    windowMinutes: 0,
    tz,
  });

  return opensAtUTC;
}

export function formatInTz(
  isoOrDate: string | Date,
  tz: string,
  pattern = 'MMM d, yyyy h:mm a zzz',
) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  return formatInTimeZone(d, tz, pattern);
}
