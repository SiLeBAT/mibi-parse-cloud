import { AVVCatalogueCacheData } from '../../../orders/infrastructure/repositories/avvcatalogue.repository';
import { AVVCatalog } from '../../../orders/legacy/model/avvcatalog.entity';
import { AVVCatalogData } from '../../../orders/legacy/model/legacy.model';

class AVVCatalogueCache {
    private avvCatalogs: AVVCatalogueCacheData;

    setAVVCatalogues(avvCatalogues: AVVCatalogueCacheData) {
        this.avvCatalogs = avvCatalogues;
        return this.avvCatalogs;
    }

    getAVVCatalog<T extends AVVCatalogData>(
        catalogName: string
    ): AVVCatalog<T> {
        return this.avvCatalogs[catalogName] as AVVCatalog<T>;
    }

    removeAllData() {
        this.avvCatalogs = {};
    }
}

const avvCatalogueCache = new AVVCatalogueCache();

export { avvCatalogueCache, AVVCatalogueCache };
