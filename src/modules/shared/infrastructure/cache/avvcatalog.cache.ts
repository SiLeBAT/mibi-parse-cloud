import { isEmpty } from 'lodash';
import { AVVCatalog } from '../../domain/valueObjects';

type AVVCatalogCacheData = {
    [key: string]: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    };
};

type AVVCatalogDates = {
    [key: string]: {
        catalogDateStr: string;
        catalogDateTime: number;
    }[];
};
class AVVCatalogCache {
    private cacheData: AVVCatalogCacheData = {};
    private avvCatalogDates: AVVCatalogDates = {};

    setAVVCatalogs(avvCatalogs: AVVCatalog[]) {
        this.updateCacheData(avvCatalogs);
        return !isEmpty(this.cacheData);
    }

    getAVVCatalogData(catalogName: string, samplingDate: string | null = null) {
        if (!samplingDate) {
            return this.latestCatalogVersion(catalogName);
        }

        const validFrom = this.findCatalogDate(catalogName, samplingDate);
        if (validFrom === undefined) {
            return this.oldestCatalogVersion(catalogName);
        }

        return this.cacheData[catalogName][validFrom];
    }

    removeAllData() {
        this.cacheData = {};
        this.avvCatalogDates = {};
    }

    private updateCacheData(avvCatalogs: AVVCatalog[]) {
        this.removeAllData();

        avvCatalogs.forEach(avvCatalog => {
            const catalogNameKey = `avv${avvCatalog.name}`;
            const catalogDate = avvCatalog.validFrom;
            const catalogData = JSON.parse(avvCatalog.data);

            this.cacheData[catalogNameKey] =
                this.cacheData[catalogNameKey] || {};
            this.cacheData[catalogNameKey][catalogDate] = catalogData;
        });

        this.updateCatalogDates();
    }

    private updateCatalogDates() {
        const catalogNames = Object.keys(this.cacheData);
        catalogNames.forEach(catalogName => {
            const catalogDateStrs = Object.keys(this.cacheData[catalogName]);
            const catalogDates = catalogDateStrs.map(catalogDateStr => {
                const [year, month, day] = catalogDateStr
                    .split('-')
                    .map(Number);
                return {
                    catalogDateStr,
                    catalogDateTime: new Date(year, month - 1, day).getTime()
                };
            });
            catalogDates.sort(
                (dateA, dateB) => dateA.catalogDateTime - dateB.catalogDateTime
            );
            this.avvCatalogDates[catalogName] = catalogDates;
        });
    }

    private findCatalogDate(catalogName: string, samplingDate: string) {
        const [day, month, year] = samplingDate.split('.').map(Number);
        const samplingDateTime = new Date(year, month - 1, day).getTime();

        const catalogDates = this.avvCatalogDates[catalogName];
        let result;

        for (const catalogDate of catalogDates) {
            if (catalogDate.catalogDateTime <= samplingDateTime) {
                result = catalogDate;
            } else {
                break;
            }
        }

        return result?.catalogDateStr;
    }

    private latestCatalogVersion(catalogName: string) {
        const catalogDates = this.avvCatalogDates[catalogName];

        if (catalogDates && catalogDates.length > 0) {
            const latestDate =
                catalogDates[catalogDates.length - 1].catalogDateStr;
            return this.cacheData[catalogName][latestDate];
        }
        return null;
    }

    private oldestCatalogVersion(catalogName: string) {
        const catalogDates = this.avvCatalogDates[catalogName];

        if (catalogDates && catalogDates.length > 0) {
            const oldestDate = catalogDates[0].catalogDateStr;
            return this.cacheData[catalogName][oldestDate];
        }
        return null;
    }
}

const avvCatalogCache = new AVVCatalogCache();

export { avvCatalogCache, AVVCatalogCache };
