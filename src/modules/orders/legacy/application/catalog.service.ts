import _ from 'lodash';

import { PLZCache } from '../../../shared/infrastructure';
import { AVVCatalog, createAVVCatalog } from '../model/avvcatalog.entity';
import { Catalog, createCatalog } from '../model/catalog.entity';
import {
    AVVCatalogData,
    CatalogData,
    SearchAlias
} from '../model/legacy.model';
import { AVVCatalogueCache } from '../../../shared/infrastructure/cache';
import { CatalogRepository } from '../repositories/catalog.repository';
import { SearchAliasCache } from '../../../shared/infrastructure/cache';

export class CatalogService {
    constructor(
        private plzCache: PLZCache,
        private catalogRepository: CatalogRepository,
        private searchAliasCache: SearchAliasCache,
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
        catalogName: string,
        samplingDate: string | null = null
    ): AVVCatalog<T> {
        const catalogData = this.avvCatalogueCache.getAVVCatalogueData(
            catalogName,
            samplingDate
        );
        const data = catalogData['data'] as AVVCatalogData;
        const uId = catalogData['uId'] as string;

        return createAVVCatalog(data, uId) as AVVCatalog<T>;
    }

    getCatalogSearchAliases(catalogName: string) {
        let searchAlias: SearchAlias[] = [];

        try {
            searchAlias = _(this.searchAliasCache.getSearchAliasCacheData())
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
