import { PLZ } from '../../domain/valueObjects';
import { BaseCache } from './base.cache';

class PLZCache extends BaseCache<string, PLZ> {
    setPLZs(plzs: PLZ[]) {
        return this.mset(plzs.map(plz => ({ key: plz.value, val: plz })));
    }

    getJSONData() {
        return this.keys().map(key => ({ plz: key }));
    }
    removeAllData() {
        return this.flushAll();
    }
}

const plzCache = new PLZCache();

export { plzCache, PLZCache };
