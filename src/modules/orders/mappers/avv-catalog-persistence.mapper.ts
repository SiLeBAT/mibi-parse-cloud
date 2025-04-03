import { AVVCatalog } from '../../shared/domain/valueObjects';
import { AVVCatalogObject } from '../../shared/infrastructure/parse-types';
import { Mapper, MappingError } from '../../shared/mappers';

export class AVVCatalogPersistenceMapper extends Mapper {
    static async fromPersistence(
        avvCatalogObject: AVVCatalogObject
    ): Promise<AVVCatalog> {
        try {
            const validFromDate = avvCatalogObject.get('validFrom');
            const year = validFromDate.getFullYear();
            const month = `${validFromDate.getMonth() + 1}`.padStart(2, '0');
            const day = `${validFromDate.getDate()}`.padStart(2, '0');

            return await AVVCatalog.create({
                name: avvCatalogObject.get('catalogCode'),
                validFrom: `${year}-${month}-${day}`,
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
