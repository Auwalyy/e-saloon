/**
 * Date and time helpers.
 * The salon operates in a single timezone, so appointments are stored as a local
 * calendar date ("YYYY-MM-DD") plus local times ("HH:mm"), alongside real UTC
 * instants (startAt / endAt) used for sorting, reminders and reporting.
 */
const env = require('../config/env');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const pad = (n) => String(n).padStart(2, '0');

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

/** Day of week (0 = Sunday) for a calendar date string. */
const weekdayOf = (dateStr) => new Date(`${dateStr}T00:00:00Z`).getUTCDay();

/** Offset in ms between UTC and the given timezone at a particular instant. */
const zoneOffsetMs = (instant, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23',
    year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
  }).formatToParts(instant).reduce((acc, part) => ({ ...acc, [part.type]: Number(part.value) }), {});
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
};

/** Converts a salon-local date + time into the matching UTC Date. */
const zonedToUtc = (dateStr, timeStr = '00:00', timeZone = env.timezone) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const guess = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  return new Date(guess.getTime() - zoneOffsetMs(guess, timeZone));
};

/** Current calendar date and minutes-since-midnight in the salon timezone. */
const nowInZone = (timeZone = env.timezone) => {
  const now = new Date();
  const local = new Date(now.getTime() + zoneOffsetMs(now, timeZone));
  return {
    date: local.toISOString().slice(0, 10),
    minutes: local.getUTCHours() * 60 + local.getUTCMinutes(),
  };
};

/** Adds days to a calendar date string. */
const addDays = (dateStr, days) => {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/**
 * Resolves a reporting period into a UTC range plus the local date boundaries.
 * `period` is one of daily | weekly | monthly | annual; `dateStr` is any date inside it.
 */
const periodRange = (period, dateStr, timeZone = env.timezone) => {
  const anchor = dateStr && DATE_PATTERN.test(dateStr) ? dateStr : nowInZone(timeZone).date;
  let from = anchor;
  let to;

  if (period === 'weekly') {
    const mondayOffset = (weekdayOf(anchor) + 6) % 7; // weeks start on Monday
    from = addDays(anchor, -mondayOffset);
    to = addDays(from, 7);
  } else if (period === 'monthly') {
    const [year, month] = anchor.split('-').map(Number);
    from = `${year}-${pad(month)}-01`;
    to = month === 12 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`;
  } else if (period === 'annual') {
    const year = Number(anchor.slice(0, 4));
    from = `${year}-01-01`;
    to = `${year + 1}-01-01`;
  } else {
    to = addDays(anchor, 1);
  }

  return {
    period: ['weekly', 'monthly', 'annual'].includes(period) ? period : 'daily',
    fromDate: from,
    toDate: addDays(to, -1), // inclusive last day, for display
    start: zonedToUtc(from, '00:00', timeZone),
    end: zonedToUtc(to, '00:00', timeZone), // exclusive
  };
};

module.exports = {
  DAY_NAMES, DATE_PATTERN, TIME_PATTERN,
  timeToMinutes, minutesToTime, weekdayOf, zonedToUtc, nowInZone, addDays, periodRange,
};
