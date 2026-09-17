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
});
