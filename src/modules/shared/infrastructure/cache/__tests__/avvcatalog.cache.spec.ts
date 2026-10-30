import { AVVCatalog } from '../../../domain/valueObjects';
import { AVVCatalogCache } from '../avvcatalog.cache';

const catalog = (validFrom: string, version: string) =>
    AVVCatalog.create({
        name: '337',
        validFrom,
        version,
        data: JSON.stringify({ version })
    });

describe('AVVCatalogCache', () => {
    let cache: AVVCatalogCache;

    beforeEach(async () => {
        cache = new AVVCatalogCache();
        cache.setAVVCatalogs([
            await catalog('2026-01-01', '9.00'),
            await catalog('2025-01-01', '8.00')
        ]);
    });

    const versionFor = (samplingDate: string | null) =>
        cache.getAVVCatalogData('avv337', samplingDate).version;

    it('uses the new catalog from the day it becomes valid', () => {
        expect(versionFor('01.01.2026')).toBe('9.00');
    });

    it('uses the previous catalog on the day before', () => {
        expect(versionFor('31.12.2025')).toBe('8.00');
    });

    it('reads sampling dates written without leading zeros', () => {
        expect(versionFor('1.1.2026')).toBe('9.00');
    });

    it('uses the oldest catalog for a sampling date before every catalog', () => {
        expect(versionFor('15.06.2020')).toBe('8.00');
    });

    it('uses the latest catalog when there is no sampling date', () => {
        expect(versionFor(null)).toBe('9.00');
    });

    describe('catalogs with the same validFrom date', () => {
        const setCatalogs = async (...versions: string[]) =>
            cache.setAVVCatalogs([
                await catalog('2025-01-01', '8.00'),
                ...(await Promise.all(
                    versions.map(version => catalog('2026-01-01', version))
                ))
            ]);

        it.each([
            ['9.00', '9.01', '9.01'],
            ['9.01', '9.00', '9.01'],
            ['9.9', '9.10', '9.10'],
            ['10.00', '9.00', '10.00'],
            ['14.00', '14.01', '14.01']
        ])(
            'uses the higher version of %s and %s',
            async (first, second, expected) => {
                await setCatalogs(first, second);
                expect(versionFor('01.01.2026')).toBe(expected);
                expect(versionFor(null)).toBe(expected);
            }
        );

        it('still uses the previous catalog on the day before', async () => {
            await setCatalogs('9.00', '9.01');
            expect(versionFor('31.12.2025')).toBe('8.00');
        });
    });
});
