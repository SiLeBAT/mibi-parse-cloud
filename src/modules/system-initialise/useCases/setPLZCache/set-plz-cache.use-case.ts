import {
    plzRepository,
    PLZRepository
} from '../../../orders/infrastructure/repositories';
import { plzCache, PLZCache } from '../../../shared/infrastructure';
import { UseCase } from '../../../shared/useCases';

class SetPLZCacheUseCase implements UseCase<null, Promise<void>> {
    constructor(
        private plzCache: PLZCache,
        private plzRepository: PLZRepository
    ) {}

    async execute(): Promise<void> {
        return await this.plzRepository
            .retrieve()
            .then(data => {
                this.plzCache.removeAllData();
                this.plzCache.setPLZs(data);
            })
            .catch((error: Error) => {
                throw error;
            });
    }
}

const setPLZCache = new SetPLZCacheUseCase(plzCache, plzRepository);

export { setPLZCache, SetPLZCacheUseCase };
