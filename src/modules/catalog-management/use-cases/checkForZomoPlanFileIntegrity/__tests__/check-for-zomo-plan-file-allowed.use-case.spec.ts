import { checkForZomoPlanFileAllowed } from '../check-for-zomo-plan-file-allowed.use-case';

type ZomoPlanFileInformationLike = Parameters<
    typeof checkForZomoPlanFileAllowed.execute
>[0];

const zomoPlanFileOfYear = (year: string) =>
    ({ year } as unknown as ZomoPlanFileInformationLike);

describe('checkForZomoPlanFileAllowed', () => {
    // 00:30 on 1 January 2027 in Berlin - still 2026 in UTC.
    const newYearInBerlin = new Date('2026-12-31T23:30:00.000Z');
    // 23:30 on 31 December 2026 in Berlin.
    const justBeforeNewYearInBerlin = new Date('2026-12-31T22:30:00.000Z');

    afterEach(() => {
        jest.useRealTimers();
    });

    it('counts the allowed years from the Berlin year', async () => {
        jest.useFakeTimers({ now: newYearInBerlin });

        const allowed = await checkForZomoPlanFileAllowed.execute(
            zomoPlanFileOfYear('2028')
        );

        expect(allowed.allowedYears).toEqual([2026, 2027, 2028]);
        expect(allowed.yearAllowed).toBe(true);
    });

    it('no longer allows the year before last', async () => {
        jest.useFakeTimers({ now: newYearInBerlin });

        const allowed = await checkForZomoPlanFileAllowed.execute(
            zomoPlanFileOfYear('2025')
        );

        expect(allowed.yearAllowed).toBe(false);
    });

    it('still counts from the old year shortly before midnight in Berlin', async () => {
        jest.useFakeTimers({ now: justBeforeNewYearInBerlin });

        const allowed = await checkForZomoPlanFileAllowed.execute(
            zomoPlanFileOfYear('2025')
        );

        expect(allowed.allowedYears).toEqual([2025, 2026, 2027]);
        expect(allowed.yearAllowed).toBe(true);
    });
});
