import { getLogger } from '../../../shared/core/logging-context';
import { AbstractRepository } from '../../../shared/infrastructure';
import {
    AVVCatalogueAttributes,
    AVVCatalogueObject,
    ObjectKeys
} from '../../../shared/infrastructure/parse-types';
import { CatalogueInformation } from '../../domain';
import { AVVCatalogueInformationMapper } from '../../mappers/catalogue-information-to-persistence.mapper';

export class AVVCatalogueInformationRepository extends AbstractRepository<AVVCatalogueObject> {
    constructor() {
        super(ObjectKeys.AVVCatalogue);
    }

    async getAllEntriesWith<T>({
        key,
        value
    }: {
        key: keyof AVVCatalogueAttributes;
        value: T;
    }): Promise<CatalogueInformation[]> {
        try {
            const query = this.getQuery();
            query.equalTo(key, value);
            const results = await query.find({
                useMasterKey: true
            });
            const catalogueInformation = results.map(
                async (obj: AVVCatalogueObject) =>
                    await AVVCatalogueInformationMapper.fromPersistence(obj)
            );
            return Promise.all(catalogueInformation);
        } catch (error) {
            getLogger().error(error.message);
        }
        return [];
    }
}
