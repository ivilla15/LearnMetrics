import { addDays, addMinutes } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export const TZ = 'America/Los_Angeles' as const;

// Return PT calendar date ("YYYY-MM-DD") for the next Friday.
// If base is already Friday in PT, return that same date.
export function nextFridayLocalDate(base: Date = new Date(), tz: string = TZ): string {
  // reinterpret 'base' as Pacific time for weekday math
  const baseInTz = toZonedTime(base, tz); // v3: was utcToZonedTime
  const weekdayIso = Number(formatInTimeZone(baseInTz, tz, 'i')); // Mon=1 ... Fri=5
  const daysToAdd = (5 - weekdayIso + 7) % 7;
  const targetInTz = addDays(baseInTz, daysToAdd);
  return formatInTimeZone(targetInTz, tz, 'yyyy-MM-dd');
}

// Combine local PT date + time → UTC instants + readable PT ISO strings
export function localDateTimeToUtcRange(params: {
  localDate: string; // "YYYY-MM-DD"
  localTime: string; // "HH:mm"
  windowMinutes: number; // e.g. 4
  tz?: string;
}) {
  const { localDate, localTime, windowMinutes, tz = TZ } = params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
    throw new Error('Invalid localDate format (expected YYYY-MM-DD)');
  }
  if (!/^\d{2}:\d{2}$/.test(localTime)) {
    throw new Error('Invalid localTime format (expected HH:mm)');
  }

  // e.g., "2025-11-07 08:00" interpreted in PT
  const combined = `${localDate} ${localTime}`;

  // v3: local zone → UTC
  const opensAtUTC = fromZonedTime(combined, tz); // was zonedTimeToUtc
  const closesAtUTC = addMinutes(opensAtUTC, windowMinutes);

  const opensAtLocalISO = formatInTimeZone(opensAtUTC, tz, "yyyy-MM-dd'T'HH:mm:ssXXX");
  const closesAtLocalISO = formatInTimeZone(closesAtUTC, tz, "yyyy-MM-dd'T'HH:mm:ssXXX");

  return { opensAtUTC, closesAtUTC, opensAtLocalISO, closesAtLocalISO };
}
