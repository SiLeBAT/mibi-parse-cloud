import _ from 'lodash';

import { AVVCatalog } from '../model/avvcatalog.entity';
import { Catalog } from '../model/catalog.entity';
import {
    AVVCatalogData,
    CatalogData,
    SearchAlias
} from '../model/legacy.model';
import { AVVCatalogRepository } from '../repositories/avvcatalog.repository';
import { CatalogRepository } from '../repositories/catalog.repository';
import { SearchAliasRepository } from '../repositories/search-alias.repository';

export class CatalogService {
    constructor(
        private catalogRepository: CatalogRepository,
        private searchAliasRepository: SearchAliasRepository,
        private avvCatalogRepository: AVVCatalogRepository
    ) {}

    getCatalog<T extends CatalogData>(catalogName: string): Catalog<T> {
        return this.catalogRepository.getCatalog<T>(catalogName);
    }

    getAVVCatalog<T extends AVVCatalogData>(
        catalogName: string
    ): AVVCatalog<T> {
        return this.avvCatalogRepository.getAVVCatalog<T>(catalogName);
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
