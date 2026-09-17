import { AVVCatalogObject } from '../../../shared/infrastructure/parse-types';
import {
    AVVCatalogPersistenceMapper,
    PersistenceToAVVCatalogMappingError
} from '../avv-catalog-persistence.mapper';

const storedCatalog = (validFrom: unknown) =>
    ({
        get: (key: string) =>
            ({
                catalogCode: '337',
                version: '9.00',
                catalogData: '{}',
                validFrom
            }[key])
    } as unknown as AVVCatalogObject);

describe('AVVCatalogPersistenceMapper', () => {
    it('reads validFrom as the calendar date it was stored as', async () => {
        const catalog = await AVVCatalogPersistenceMapper.fromPersistence(
            storedCatalog(new Date('2026-01-01T00:00:00.000Z'))
        );

        expect(catalog.validFrom).toBe('2026-01-01');
    });

    it('reads the day in UTC, whatever the timezone of the server', async () => {
        // Local getters would read 2 January here on a server east of UTC, and
        // 31 December for a UTC midnight on a server west of UTC.
        const catalog = await AVVCatalogPersistenceMapper.fromPersistence(
            storedCatalog(new Date('2026-01-01T23:30:00.000Z'))
        );

        expect(catalog.validFrom).toBe('2026-01-01');
    });

    it('fails when validFrom is missing', async () => {
        await expect(
            AVVCatalogPersistenceMapper.fromPersistence(
                storedCatalog(undefined)
            )
        ).rejects.toBeInstanceOf(PersistenceToAVVCatalogMappingError);
    });

    it('fails when validFrom is not a valid date', async () => {
        await expect(
            AVVCatalogPersistenceMapper.fromPersistence(
                storedCatalog(new Date('not a date'))
            )
        ).rejects.toBeInstanceOf(PersistenceToAVVCatalogMappingError);
    });
});
