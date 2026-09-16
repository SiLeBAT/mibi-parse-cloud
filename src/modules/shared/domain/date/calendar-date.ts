import moment from 'moment';

/*
 * Dates in the MiBi domain come in two kinds, and they are handled differently.
 *
 * A timestamp is a moment in time. It is kept and sent as a UTC instant, and
 * only shown in the reader's local time.
 *
 * A calendar date - a sampling date, an isolation date, the date a catalog
 * becomes valid - carries no time and no timezone. It is parsed as UTC midnight
 * and read back with UTC getters, so it stays the same day wherever the code
 * runs.
 *
 * "Today" and "the current year" are business values, so they are taken in
 * Europe/Berlin. They must not be taken from the host timezone, which nothing
 * in this repository sets, and not from plain UTC either: between 00:00 and
 * 02:00 Berlin time the UTC date is still yesterday, which would report a
 * sample taken today as a sample taken in the future.
 */

const BERLIN_TIME_ZONE = 'Europe/Berlin';

// The formats the sample sheet uses for a calendar date.
const CALENDAR_DATE_FORMATS = [
    'DD.MM.YYYY',
    'D.MM.YYYY',
    'D.M.YYYY',
    'DD.M.YYYY'
];

const berlinDate = new Intl.DateTimeFormat('en-GB', {
    timeZone: BERLIN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

function berlinDateParts(now: Date): {
    year: number;
    month: number;
    day: number;
} {
    const parts = berlinDate.formatToParts(now);
    const partValue = (type: string) =>
        Number(parts.find(part => part.type === type)?.value);

    return {
        year: partValue('year'),
        month: partValue('month'),
        day: partValue('day')
    };
}

/**
 * Reads a calendar date written the way the sample sheet writes it
 * ("05.06.2026") as UTC midnight. An unreadable date gives an invalid moment,
 * which the caller is expected to check with isValid().
 */
export function parseCalendarDate(value: string): moment.Moment {
    return moment.utc(value, CALENDAR_DATE_FORMATS, true);
}

/**
 * Today's date in Europe/Berlin, as UTC midnight, so it can be compared with a
 * parsed calendar date.
 */
export function todayInBerlin(now: Date = new Date()): moment.Moment {
    const { year, month, day } = berlinDateParts(now);

    return moment.utc({ year, month: month - 1, day });
}

/**
 * The current year in Europe/Berlin.
 */
export function currentYearInBerlin(now: Date = new Date()): number {
    return berlinDateParts(now).year;
}

/**
 * Writes a calendar date as "YYYY-MM-DD", reading it in UTC - the timezone it
 * was stored in.
 */
export function toCalendarDateString(date: Date): string {
    return moment.utc(date).format('YYYY-MM-DD');
}
