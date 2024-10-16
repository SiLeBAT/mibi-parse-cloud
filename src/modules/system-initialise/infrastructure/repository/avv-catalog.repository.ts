import { AbstractRepository } from '../../../shared/infrastructure';
import {
    AVVCatalogueObject,
    ObjectKeys
} from '../../../shared/infrastructure/parse-types';

export class AVVCatalogRepository extends AbstractRepository<AVVCatalogueObject> {}

const avvCatalogRepository = new AVVCatalogRepository(ObjectKeys.AVVCatalogue);

export { avvCatalogRepository };
