import { getLogger } from '../../shared/core/logging-context';
import { Mapper, MappingError } from '../../shared/mappers';
import { CatalogueInformation } from '../domain';
import { AVVCatalogueObject } from '../infrastructure';

export class AVVCatalogueInformationMapper extends Mapper {
    public static async fromPersistence(
        avvCatalogueObject: AVVCatalogueObject
    ): Promise<CatalogueInformation> {
        try {
            const validFrom = avvCatalogueObject.get('validFrom');
            if (!validFrom) {
                throw new Error(
                    'Unable to create CatalogueInformation: validFrom Date missing.'
                );
            }
            const catalogueCode = avvCatalogueObject.get('catalogueCode') || '';
            const version = avvCatalogueObject.get('version') || '';

            return await CatalogueInformation.create({
                validFrom,
                catalogueCode,
                version
            });
        } catch (error) {
            getLogger().error(error.message);
            throw new AVVCatalogueInformationMappingError(
                'Unable to map CatalogueInformation',
                error
            );
        }
    }
}

export class AVVCatalogueInformationMappingError extends MappingError {}
