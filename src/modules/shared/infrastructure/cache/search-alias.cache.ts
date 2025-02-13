import { isEmpty } from 'lodash';
import { SearchAlias } from '../../../shared/domain/valueObjects';

interface SearchAliasCacheData {
    catalog: string;
    token: string;
    alias: string[];
}

class SearchAliasCache {
    private cacheData: SearchAliasCacheData[] = [];

    setSearchAliase(searchAliase: SearchAlias[]) {
        this.cacheData = searchAliase.map(searchAlias => ({
            catalog: searchAlias.catalog,
            token: searchAlias.token,
            alias: searchAlias.alias
        }));
        return !isEmpty(this.cacheData);
    }

    getSearchAliasCacheData() {
        return this.cacheData;
    }

    removeAllData() {
        this.cacheData = [];
    }
}

const searchAliasCache = new SearchAliasCache();

export { searchAliasCache, SearchAliasCache };
