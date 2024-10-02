import { NRLCache, nrlCache } from '../../../shared/infrastructure';
import { UseCase } from '../../../shared/useCases';
import { nrlRepository, NRLRepository } from '../../infrastructure/repository';

class SetNRLCacheUseCase implements UseCase<null, Promise<void>> {
    constructor(
        private nrlCache: NRLCache,
        private nrlRepository: NRLRepository
    ) {}

    async execute(): Promise<void> {
        this.nrlRepository
            .retrieve()
            .then(data => {
                this.nrlCache.setNRLs(data);
            })
            .catch((error: Error) => {
                throw error;
            });
    }
}

const setNRLCache = new SetNRLCacheUseCase(nrlCache, nrlRepository);

export { setNRLCache };
