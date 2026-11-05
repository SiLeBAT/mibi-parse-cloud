import { ZomoPlanInformation } from '../../../domain';
import { zomoPlanInformationRepository } from '../../../infrastructure/repository';
import { checkForZomoPlanDuplication } from '../check-for-zomo-plan-duplication.use-case';

const zomoPlanOfYear = (year: string) => ZomoPlanInformation.create({ year });

describe('checkForZomoPlanDuplication', () => {
    const storeZomoPlans = async (
        ...zomoPlans: Promise<ZomoPlanInformation>[]
    ) =>
        jest
            .spyOn(zomoPlanInformationRepository, 'getAllEntriesWith')
            .mockResolvedValue(await Promise.all(zomoPlans));

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('queries the stored plans by year', async () => {
        const getAllEntriesWith = await storeZomoPlans();

        await checkForZomoPlanDuplication.execute(await zomoPlanOfYear('2026'));

        expect(getAllEntriesWith).toHaveBeenCalledWith({
            key: 'year',
            value: '2026'
        });
    });

    it('is no duplicate if no plan is stored for the year', async () => {
        await storeZomoPlans();

        const isDuplicate = await checkForZomoPlanDuplication.execute(
            await zomoPlanOfYear('2026')
        );

        expect(isDuplicate).toBe(false);
    });

    it('is a duplicate if a plan is stored for the year', async () => {
        await storeZomoPlans(zomoPlanOfYear('2026'));

        const isDuplicate = await checkForZomoPlanDuplication.execute(
            await zomoPlanOfYear('2026')
        );

        expect(isDuplicate).toBe(true);
    });

    it('ignores stored plans of another year', async () => {
        await storeZomoPlans(zomoPlanOfYear('2025'));

        const isDuplicate = await checkForZomoPlanDuplication.execute(
            await zomoPlanOfYear('2026')
        );

        expect(isDuplicate).toBe(false);
    });
});
