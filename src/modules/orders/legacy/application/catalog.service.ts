import _ from 'lodash';

import { PLZCache } from '../../../shared/infrastructure';
import { AVVCatalog } from '../model/avvcatalog.entity';
import { Catalog, createCatalog } from '../model/catalog.entity';
import {
    AVVCatalogData,
    CatalogData,
    SearchAlias
} from '../model/legacy.model';
import { AVVCatalogueCache } from '../../../shared/infrastructure/cache/avvcatalogue.cache';
import { CatalogRepository } from '../repositories/catalog.repository';
import { SearchAliasRepository } from '../repositories/search-alias.repository';

export class CatalogService {
    constructor(
        private plzCache: PLZCache,
        private catalogRepository: CatalogRepository,
        private searchAliasRepository: SearchAliasRepository,
        private avvCatalogueCache: AVVCatalogueCache
    ) {}

    getCatalog<T extends CatalogData>(catalogName: string): Catalog<T> {
        switch (catalogName) {
            case 'plz': {
                return createCatalog(
                    this.plzCache.getJSONData(),
                    'plz'
                ) as unknown as Catalog<T>;
            }
            default:
                return this.catalogRepository.getCatalog<T>(catalogName);
        }
    }

    getAVVCatalog<T extends AVVCatalogData>(
        catalogName: string
    ): AVVCatalog<T> {
        return this.avvCatalogueCache.getAVVCatalog<T>(catalogName);
    }

    getCatalogSearchAliases(catalogName: string) {
        let searchAlias: SearchAlias[] = [];

        try {
            searchAlias = _(this.searchAliasRepository.getAliases())
                .filter(
                    (e: SearchAlias) =>
                        e.catalog.toLowerCase().localeCompare(catalogName) === 0
                )
                .value();
        } catch (error) {
            console.log(
                `${this.constructor.name}.${this.getCatalogSearchAliases.name}, no SearchAlias configuration found in configuration, error=${error}`
            );
        }
        return searchAlias;
    }
}
