import { CatalogInformation } from '../../../domain/catalog-information.vo';
import { aVVCatalogInformationRepository } from '../../../infrastructure/repository';
import { checkForCatalogSameValidFrom } from '../check-for-catalog-same-valid-from.use-case';

const validFrom = new Date('2026-07-01T00:00:00.000Z');

const catalog = (catalogCode: string, version: string) =>
    CatalogInformation.create({ validFrom, catalogCode, version });

describe('checkForCatalogSameValidFrom', () => {
    const storeCatalogs = async (...catalogs: Promise<CatalogInformation>[]) =>
        jest
            .spyOn(aVVCatalogInformationRepository, 'getAllEntriesWith')
            .mockResolvedValue(await Promise.all(catalogs));

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns no warning if no catalog is stored for the date', async () => {
        await storeCatalogs();

        const warning = await checkForCatalogSameValidFrom.execute(
            await catalog('324', '14.00')
        );

        expect(warning).toBeNull();
    });

    it('warns about a stored catalog with a higher version', async () => {
        await storeCatalogs(catalog('324', '14.04'));

        const warning = await checkForCatalogSameValidFrom.execute(
            await catalog('324', '14.00')
        );

        expect(warning).toBe(
            'There is already a catalog 324 with the version 14.04 and the same valid from date 1 Jul 2026 present'
        );
    });

    it('warns about a stored catalog with a lower version', async () => {
        await storeCatalogs(catalog('324', '14.00'));

        const warning = await checkForCatalogSameValidFrom.execute(
            await catalog('324', '14.04')
        );

        expect(warning).toBe(
            'There is already a catalog 324 with the version 14.00 and the same valid from date 1 Jul 2026 present'
        );
    });

    it('ignores stored catalogs with another catalog code', async () => {
        await storeCatalogs(catalog('319', '14.04'));

        const warning = await checkForCatalogSameValidFrom.execute(
            await catalog('324', '14.00')
        );

        expect(warning).toBeNull();
    });

    it('lists several stored versions in version order', async () => {
        await storeCatalogs(catalog('324', '14.10'), catalog('324', '14.9'));

        const warning = await checkForCatalogSameValidFrom.execute(
            await catalog('324', '14.00')
        );

        expect(warning).toBe(
            'There is already a catalog 324 with the version 14.9 and the same valid from date 1 Jul 2026 present; ' +
                'There is already a catalog 324 with the version 14.10 and the same valid from date 1 Jul 2026 present'
        );
    });
});
