import { ZomoPlan } from '../../../domain/valueObjects';
import { ZomoPlanCache } from '../zomo-plan.cache';

const zomoPlan = (year: string) =>
    ZomoPlan.create({
        year,
        data: JSON.stringify({ data: { year, zomoData: [] } })
    });

describe('ZomoPlanCache', () => {
    // 00:30 on 1 January 2027 in Berlin - still 2026 in UTC.
    const newYearInBerlin = new Date('2026-12-31T23:30:00.000Z');
    // 23:30 on 31 December 2026 in Berlin.
    const justBeforeNewYearInBerlin = new Date('2026-12-31T22:30:00.000Z');

    let cache: ZomoPlanCache;

    beforeEach(async () => {
        cache = new ZomoPlanCache();
        cache.setZomoPlans([await zomoPlan('2025'), await zomoPlan('2026')]);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('serves the plan of this year and last year, counted in Berlin', () => {
        jest.useFakeTimers({ now: newYearInBerlin });

        expect(cache.getZomoPlanData('15.06.2026')).not.toBeNull();
        expect(cache.getZomoPlanData('15.06.2025')).toBeNull();
    });

    it('still serves the 2025 plan shortly before midnight in Berlin', () => {
        jest.useFakeTimers({ now: justBeforeNewYearInBerlin });

        expect(cache.getZomoPlanData('15.06.2025')).not.toBeNull();
    });

    it('serves nothing without a sampling date', () => {
        expect(cache.getZomoPlanData(null)).toBeNull();
    });
});
