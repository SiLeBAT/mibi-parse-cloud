import { NRL } from '../../../system-monitoring/domain/nrl.entity';
import { NRL_ID_VALUE, NRLId } from '../../domain/valueObjects/nrl-id.vo';
import { BaseCache } from './base.cache';

class NRLCache extends BaseCache<NRL_ID_VALUE, NRL> {
    getNRLList(): NRL[] {
        const keys = this.keys().map(k => NRLId.mapNRLStringToEnum(k));
        return Object.values(this.mget(keys));
    }

    getNRLById(id: NRL_ID_VALUE): NRL | undefined {
        return this.get(id);
    }

    setNRLs(nrls: NRL[]) {
        return this.mset(nrls.map(nrl => ({ key: nrl.nrlId, val: nrl })));
    }
}

const nrlCache = new NRLCache();

export { nrlCache, NRLCache };
