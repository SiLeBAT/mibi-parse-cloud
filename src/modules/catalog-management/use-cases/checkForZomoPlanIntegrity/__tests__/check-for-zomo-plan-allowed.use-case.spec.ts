import { checkForZomoPlanAllowed } from '../check-for-zomo-plan-allowed.use-case';

type ZomoPlanInformationLike = Parameters<
    typeof checkForZomoPlanAllowed.execute
>[0];

const zomoPlanOfYear = (year: string) =>
    ({ year } as unknown as ZomoPlanInformationLike);

describe('checkForZomoPlanAllowed', () => {
    // 00:30 on 1 January 2027 in Berlin - still 2026 in UTC.
    const newYearInBerlin = new Date('2026-12-31T23:30:00.000Z');
    // 23:30 on 31 December 2026 in Berlin.
    const justBeforeNewYearInBerlin = new Date('2026-12-31T22:30:00.000Z');

    afterEach(() => {
        jest.useRealTimers();
    });

    it('counts the allowed years from the Berlin year', async () => {
        jest.useFakeTimers({ now: newYearInBerlin });

        const allowed = await checkForZomoPlanAllowed.execute(
            zomoPlanOfYear('2028')
        );

        expect(allowed.allowedYears).toEqual([2026, 2027, 2028]);
        expect(allowed.yearAllowed).toBe(true);
    });

    it('no longer allows the year before last', async () => {
        jest.useFakeTimers({ now: newYearInBerlin });

        const allowed = await checkForZomoPlanAllowed.execute(
            zomoPlanOfYear('2025')
        );

        expect(allowed.yearAllowed).toBe(false);
    });

    it('still counts from the old year shortly before midnight in Berlin', async () => {
        jest.useFakeTimers({ now: justBeforeNewYearInBerlin });

        const allowed = await checkForZomoPlanAllowed.execute(
            zomoPlanOfYear('2025')
        );

        expect(allowed.allowedYears).toEqual([2025, 2026, 2027]);
        expect(allowed.yearAllowed).toBe(true);
    });
});
