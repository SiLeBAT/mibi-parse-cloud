import { ZomoPlanFileInformation } from '../../../domain';
import { zomoPlanFileInformationRepository } from '../../../infrastructure/repository';
import { checkForTwoZomoPlanFiles } from '../check-for-two-zomo-plan-files.use-case';

describe('checkForTwoZomoPlanFiles', () => {
    const storeZomoPlanFilesOfYears = async (...years: string[]) =>
        jest
            .spyOn(zomoPlanFileInformationRepository, 'getAllEntries')
            .mockResolvedValue(
                await Promise.all(
                    years.map(year => ZomoPlanFileInformation.create({ year }))
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
    ])('with the stored plan files %j returns %s', async (years, twoExist) => {
        await storeZomoPlanFilesOfYears(...years);

        expect(await checkForTwoZomoPlanFiles.execute()).toBe(twoExist);
    });
});
