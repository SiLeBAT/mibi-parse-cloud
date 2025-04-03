import { isEmpty } from 'lodash';
import { ZomoPlan } from '../../domain/valueObjects';

type ZomoPlanCacheData = {
    [year: string]: ZomoPlanData;
};

type ZomoPlanData = {
    data: {
        year: string;
        zomoData: ZomoData[];
    };
};

type ZomoData = {
    '303': object[];
    '316': object[];
    '319': object[];
    '324': string[];
    '328': object[];
    '339': object[];
};

class ZomoPlanCache {
    private cacheData: ZomoPlanCacheData = {};

    setZomoPlans(zomoPlans: ZomoPlan[]) {
        this.updateCacheData(zomoPlans);

        return !isEmpty(this.cacheData);
    }

    getZomoPlanData(samplingDate: string | null = null) {
        if (!samplingDate) {
            return null;
        }

        const validYear = this.findZomoPlanYear(samplingDate);
        if (validYear === undefined) {
            return null;
        }

        return this.cacheData[validYear];
    }

    removeAllData() {
        this.cacheData = {};
    }

    private updateCacheData(zomoPlans: ZomoPlan[]) {
        this.removeAllData();

        zomoPlans.forEach(zomoPlan => {
            const year = zomoPlan.year;
            const data = JSON.parse(zomoPlan.data);
            this.cacheData[year] = data;
        });
    }

    private findZomoPlanYear(samplingDate: string) {
        const year = samplingDate.split('.').map(Number)[2];

        return year;
    }
}

const zomoPlanCache = new ZomoPlanCache();

export { zomoPlanCache, ZomoPlanCache };
