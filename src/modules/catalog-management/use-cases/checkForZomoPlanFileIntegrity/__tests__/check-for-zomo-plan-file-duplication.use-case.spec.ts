import { ZomoPlanFileInformation } from '../../../domain';
import { zomoPlanFileInformationRepository } from '../../../infrastructure/repository';
import { checkForZomoPlanFileDuplication } from '../check-for-zomo-plan-file-duplication.use-case';

const zomoPlanFileOfYear = (year: string) =>
    ZomoPlanFileInformation.create({ year });

describe('checkForZomoPlanFileDuplication', () => {
    const storeZomoPlanFiles = async (
        ...zomoPlanFiles: Promise<ZomoPlanFileInformation>[]
    ) =>
        jest
            .spyOn(zomoPlanFileInformationRepository, 'getAllEntriesWith')
            .mockResolvedValue(await Promise.all(zomoPlanFiles));

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('queries the stored plan files by year', async () => {
        const getAllEntriesWith = await storeZomoPlanFiles();

        await checkForZomoPlanFileDuplication.execute(
            await zomoPlanFileOfYear('2026')
        );

        expect(getAllEntriesWith).toHaveBeenCalledWith({
            key: 'year',
            value: '2026'
        });
    });

    it('is no duplicate if no plan file is stored for the year', async () => {
        await storeZomoPlanFiles();

        const isDuplicate = await checkForZomoPlanFileDuplication.execute(
            await zomoPlanFileOfYear('2026')
        );

        expect(isDuplicate).toBe(false);
    });

    it('is a duplicate if a plan file is stored for the year', async () => {
        await storeZomoPlanFiles(zomoPlanFileOfYear('2026'));

        const isDuplicate = await checkForZomoPlanFileDuplication.execute(
            await zomoPlanFileOfYear('2026')
        );

        expect(isDuplicate).toBe(true);
    });

    it('ignores stored plan files of another year', async () => {
        await storeZomoPlanFiles(zomoPlanFileOfYear('2025'));

        const isDuplicate = await checkForZomoPlanFileDuplication.execute(
            await zomoPlanFileOfYear('2026')
        );

        expect(isDuplicate).toBe(false);
    });
});
