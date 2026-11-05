import { ZomoPlanInformation } from '../../../domain';
import { zomoPlanInformationRepository } from '../../../infrastructure/repository';
import { checkForTwoZomoPlans } from '../check-for-two-zomo-plans.use-case';

describe('checkForTwoZomoPlans', () => {
    const storeZomoPlansOfYears = async (...years: string[]) =>
        jest
            .spyOn(zomoPlanInformationRepository, 'getAllEntries')
            .mockResolvedValue(
                await Promise.all(
                    years.map(year => ZomoPlanInformation.create({ year }))
                )
            );

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it.each([
        [[], false],
        [['2026'], false],
        [['2025', '2026'], true],
        [['2024', '2025', '2026'], true]
    ])('with the stored plans %j returns %s', async (years, twoExist) => {
        await storeZomoPlansOfYears(...years);

        expect(await checkForTwoZomoPlans.execute()).toBe(twoExist);
    });
});
