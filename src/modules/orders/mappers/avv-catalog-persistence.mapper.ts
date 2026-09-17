import { toCalendarDateString } from '../../shared/domain/date';
import { AVVCatalog } from '../../shared/domain/valueObjects';
import { AVVCatalogObject } from '../../shared/infrastructure/parse-types';
import { Mapper, MappingError } from '../../shared/mappers';

export class AVVCatalogPersistenceMapper extends Mapper {
    static async fromPersistence(
        avvCatalogObject: AVVCatalogObject
    ): Promise<AVVCatalog> {
        try {
            const validFromDate = avvCatalogObject.get('validFrom');
            if (
                !(validFromDate instanceof Date) ||
                Number.isNaN(validFromDate.getTime())
            ) {
                throw new Error('validFrom date missing or invalid');
            }

            return await AVVCatalog.create({
                name: avvCatalogObject.get('catalogCode'),
                validFrom: toCalendarDateString(validFromDate),
                version: avvCatalogObject.get('version'),
                data: avvCatalogObject.get('catalogData')
            });
        } catch (error) {
            throw new PersistenceToAVVCatalogMappingError(
                'Unable to map AVV Catalog Persistence to AVV Catalog',
                error
            );
        }
    }
}

export class PersistenceToAVVCatalogMappingError extends MappingError {}
