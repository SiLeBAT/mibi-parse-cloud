import {
    zomoPlanCache,
    ZomoPlanCache
} from '../../../shared/infrastructure/cache/zomo-plan.cache';
import { UseCase } from '../../../shared/use-cases';
import {
    zomoPlanRepository,
    ZomoPlanRepository
} from '../../infrastructure/repository';

class SetZomoPlanCacheUseCase implements UseCase<null, Promise<void>> {
    constructor(
        private zomoPlanCache: ZomoPlanCache,
        private zomoPlanRepository: ZomoPlanRepository
    ) {}

    async execute(): Promise<void> {
        return await this.zomoPlanRepository
            .retrieve()
            .then(data => {
                // console.log('SetZomoPlanCacheUseCase, execute, data: ', data);

                this.zomoPlanCache.removeAllData();
                this.zomoPlanCache.setZomoPlans(data);
            })
            .catch((error: Error) => {
                throw error;
            });
    }
}

const setZomoPlanCache = new SetZomoPlanCacheUseCase(
    zomoPlanCache,
    zomoPlanRepository
);

export { setZomoPlanCache, SetZomoPlanCacheUseCase };
