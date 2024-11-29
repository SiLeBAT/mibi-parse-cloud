import {
    searchAliasCache,
    SearchAliasCache
} from '../../../shared/infrastructure/cache/search-alias.cache';
import { UseCase } from '../../../shared/use-cases';
import {
    searchAliasRepository,
    SearchAliasRepository
} from '../../infrastructure/repository';

class SetSearchAliasCacheUseCase implements UseCase<null, Promise<void>> {
    constructor(
        private searchAliasCache: SearchAliasCache,
        private searchAliasRepository: SearchAliasRepository
    ) {}

    async execute(): Promise<void> {
        return await this.searchAliasRepository
            .retrieve()
            .then(data => {
                this.searchAliasCache.removeAllData();
                this.searchAliasCache.setSearchAliase(data);
            })
            .catch((error: Error) => {
                throw error;
            });
    }
}

const setSearchAliasCache = new SetSearchAliasCacheUseCase(
    searchAliasCache,
    searchAliasRepository
);

export { setSearchAliasCache, SetSearchAliasCacheUseCase };
