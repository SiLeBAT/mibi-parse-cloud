import {
    avvCatalogueRepository,
    AVVCatalogueRepository
} from '../../../orders/infrastructure/repositories';
import {
    avvCatalogueCache,
    AVVCatalogueCache
} from '../../../shared/infrastructure/cache/avvcatalogue.cache';
import { UseCase } from '../../../shared/use-cases';

class SetAVVCatalogueCacheUseCase implements UseCase<null, Promise<void>> {
    constructor(
        private avvCatalogueCache: AVVCatalogueCache,
        private avvCatalogueRepository: AVVCatalogueRepository
    ) {}

    async execute(): Promise<void> {
        return await this.avvCatalogueRepository
            .retrieve()
            .then(data => {
                this.avvCatalogueCache.removeAllData();
                this.avvCatalogueCache.setAVVCatalogues(data);
            })
            .catch((error: Error) => {
                throw error;
            });
    }
}

const setAVVCatalogueCache = new SetAVVCatalogueCacheUseCase(
    avvCatalogueCache,
    avvCatalogueRepository
);

export { setAVVCatalogueCache, SetAVVCatalogueCacheUseCase };
