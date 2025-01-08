import {
    avvCatalogCache,
    AVVCatalogCache
} from '../../../shared/infrastructure/cache/avvcatalog.cache';
import { UseCase } from '../../../shared/use-cases';
import {
    avvCatalogRepository,
    AVVCatalogRepository
} from '../../infrastructure/repository';

class SetAVVCatalogCacheUseCase implements UseCase<null, Promise<void>> {
    constructor(
        private avvCatalogCache: AVVCatalogCache,
        private avvCatalogRepository: AVVCatalogRepository
    ) {}

    async execute(): Promise<void> {
        return await this.avvCatalogRepository
            .retrieve()
            .then(data => {
                this.avvCatalogCache.removeAllData();
                this.avvCatalogCache.setAVVCatalogs(data);
            })
            .catch((error: Error) => {
                throw error;
            });
    }
}

const setAVVCatalogCache = new SetAVVCatalogCacheUseCase(
    avvCatalogCache,
    avvCatalogRepository
);

export { setAVVCatalogCache, SetAVVCatalogCacheUseCase };
