import { getLogger } from '../../../shared/core/logging-context';
import { AbstractRepository } from '../../../shared/infrastructure';
import {
    AVVCatalogAttributes,
    AVVCatalogObject,
    ObjectKeys
} from '../../../shared/infrastructure/parse-types';
import { CatalogInformation } from '../../domain';
import { AVVCatalogInformationMapper } from '../../mappers/catalog-information-to-persistence.mapper';

export class AVVCatalogInformationRepository extends AbstractRepository<AVVCatalogObject> {
    constructor() {
        super(ObjectKeys.AVVCatalog);
    }

    async getAllEntriesWith<T>({
        key,
        value
    }: {
        key: keyof AVVCatalogAttributes;
        value: T;
    }): Promise<CatalogInformation[]> {
        try {
            const query = this.getQuery();
            query.equalTo(key, value);
            const results = await query.find({
                useMasterKey: true
            });
            const catalogInformation = results.map(
                async (obj: AVVCatalogObject) =>
                    await AVVCatalogInformationMapper.fromPersistence(obj)
            );
            return Promise.all(catalogInformation);
        } catch (error) {
            getLogger().error(error.message);
        }
        return [];
    }
}
