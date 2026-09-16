import {
    currentYearInBerlin,
    parseCalendarDate,
    toCalendarDateString,
    todayInBerlin
} from '../calendar-date';

describe('parseCalendarDate', () => {
    it('reads a sample sheet date as UTC midnight', () => {
        expect(parseCalendarDate('05.06.2026').toISOString()).toBe(
            '2026-06-05T00:00:00.000Z'
        );
    });

    it('reads days and months written without a leading zero', () => {
        expect(parseCalendarDate('5.6.2026').toISOString()).toBe(
            '2026-06-05T00:00:00.000Z'
        );
        expect(parseCalendarDate('5.06.2026').toISOString()).toBe(
            '2026-06-05T00:00:00.000Z'
        );
    });

    it('rejects anything that is not a sample sheet date', () => {
        expect(parseCalendarDate('2026-06-05').isValid()).toBe(false);
        expect(parseCalendarDate('05/06/2026').isValid()).toBe(false);
        expect(parseCalendarDate('5.6.26').isValid()).toBe(false);
        expect(parseCalendarDate('32.01.2026').isValid()).toBe(false);
        expect(parseCalendarDate('').isValid()).toBe(false);
    });
});

describe('todayInBerlin', () => {
    it('is the Berlin date, not the UTC date', () => {
        // 00:30 on 17 September in Berlin is still 16 September in UTC.
        const justAfterMidnightInBerlin = new Date('2026-09-16T22:30:00.000Z');

        expect(todayInBerlin(justAfterMidnightInBerlin).toISOString()).toBe(
            '2026-09-17T00:00:00.000Z'
        );
    });

    it('is still yesterday shortly before midnight in Berlin', () => {
        const justBeforeMidnightInBerlin = new Date('2026-09-16T21:30:00.000Z');

        expect(todayInBerlin(justBeforeMidnightInBerlin).toISOString()).toBe(
            '2026-09-16T00:00:00.000Z'
        );
    });

    it('turns the year over at midnight in Berlin', () => {
        // Winter, so Berlin is one hour ahead of UTC.
        const newYearInBerlin = new Date('2026-12-31T23:30:00.000Z');

        expect(todayInBerlin(newYearInBerlin).toISOString()).toBe(
            '2027-01-01T00:00:00.000Z'
        );
    });

    it('gives the right day on the days the clocks change', () => {
        const clocksGoForward = new Date('2026-03-29T00:30:00.000Z');
        const clocksGoBack = new Date('2026-10-25T00:30:00.000Z');

        expect(todayInBerlin(clocksGoForward).toISOString()).toBe(
            '2026-03-29T00:00:00.000Z'
        );
        expect(todayInBerlin(clocksGoBack).toISOString()).toBe(
            '2026-10-25T00:00:00.000Z'
        );
    });
});

describe('currentYearInBerlin', () => {
    it('is the new year once it is midnight in Berlin', () => {
        expect(currentYearInBerlin(new Date('2026-12-31T23:30:00.000Z'))).toBe(
            2027
        );
    });

    it('is the old year while it is still December in Berlin', () => {
        expect(currentYearInBerlin(new Date('2026-12-31T22:30:00.000Z'))).toBe(
            2026
        );
    });

    it('is the year the date is in for the rest of the year', () => {
        expect(currentYearInBerlin(new Date('2026-06-05T12:00:00.000Z'))).toBe(
            2026
        );
    });
});

describe('toCalendarDateString', () => {
    it('writes a stored calendar date as YYYY-MM-DD', () => {
        expect(toCalendarDateString(new Date('2026-01-01T00:00:00.000Z'))).toBe(
            '2026-01-01'
        );
    });

    it('reads the date in UTC, so a late hour stays on its own day', () => {
        expect(toCalendarDateString(new Date('2026-01-01T23:30:00.000Z'))).toBe(
            '2026-01-01'
        );
    });

    it('writes back what todayInBerlin produced', () => {
        const justAfterMidnightInBerlin = new Date('2026-09-16T22:30:00.000Z');

        expect(
            toCalendarDateString(
                todayInBerlin(justAfterMidnightInBerlin).toDate()
            )
        ).toBe('2026-09-17');
    });
});
