import { logger } from '../../../../system/logging';
import { AVVCatalog } from '../../../shared/domain/valueObjects/avvcatalog.vo';
import { AbstractRepository } from '../../../shared/infrastructure';
import { AVVCatalogObject } from '../../../shared/infrastructure/parse-types';
import { AVVCatalogPersistenceMapper } from '../../mappers';

export class AVVCatalogRepository extends AbstractRepository<AVVCatalogObject> {
    async retrieve(): Promise<AVVCatalog[]> {
        logger.info(
            `${this.constructor.name}.${this.retrieve.name}, loading AVV Catalog data from Database.`
        );

        const query = this.getQuery();
        const allCatalogs = await query.findAll({ useMasterKey: true });

        const avvCatalogs = Promise.all(
            allCatalogs.map(avvCatalog =>
                AVVCatalogPersistenceMapper.fromPersistence(avvCatalog)
            )
        );

        logger.info(
            `${this.constructor.name}.${this.retrieve.name}, finished loading AVV Catalog data from Database.`
        );

        return avvCatalogs;
    }
}
