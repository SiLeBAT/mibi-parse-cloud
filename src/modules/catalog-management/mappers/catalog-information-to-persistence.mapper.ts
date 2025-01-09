import { getLogger } from '../../shared/core/logging-context';
import { AVVCatalogObject } from '../../shared/infrastructure/parse-types';
import { Mapper, MappingError } from '../../shared/mappers';
import { CatalogInformation } from '../domain';

export class AVVCatalogInformationMapper extends Mapper {
    public static async fromPersistence(
        avvCatalogObject: AVVCatalogObject
    ): Promise<CatalogInformation> {
        try {
            const validFrom = avvCatalogObject.get('validFrom');
            if (!validFrom) {
                throw new Error(
                    'Unable to create CatalogInformation: validFrom Date missing.'
                );
            }
            const catalogCode = avvCatalogObject.get('catalogCode') || '';
            const version = avvCatalogObject.get('version') || '';

            return await CatalogInformation.create({
                validFrom,
                catalogCode,
                version
            });
        } catch (error) {
            getLogger().error(error.message);
            throw new AVVCatalogInformationMappingError(
                'Unable to map CatalogInformation',
                error
            );
        }
    }
}

export class AVVCatalogInformationMappingError extends MappingError {}
