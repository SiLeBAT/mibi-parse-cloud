import { isEmpty } from 'lodash';
import { AVVCatalogue } from '../../../shared/domain/valueObjects';

type AVVCatalogueCacheData = {
    [key: string]: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    };
};

type AVVCatalogueDates = {
    [key: string]: {
        catalogueDateStr: string;
        catalogueDateTime: number;
    }[];
};
class AVVCatalogueCache {
    private cacheData: AVVCatalogueCacheData = {};
    private avvCatalogueDates: AVVCatalogueDates = {};

    setAVVCatalogues(avvCatalogues: AVVCatalogue[]) {
        this.updateCacheData(avvCatalogues);
        return !isEmpty(this.cacheData);
    }

    getAVVCatalogueData(
        catalogueName: string,
        samplingDate: string | null = null
    ) {
        if (!samplingDate) {
            return this.latestCatalogueVersion(catalogueName);
        }

        const validFrom = this.findCatalogueDate(catalogueName, samplingDate);
        if (validFrom === undefined) {
            return this.oldestCatalogueVersion(catalogueName);
        }

        return this.cacheData[catalogueName][validFrom];
    }

    removeAllData() {
        this.cacheData = {};
        this.avvCatalogueDates = {};
    }

    private updateCacheData(avvCatalogues: AVVCatalogue[]) {
        this.removeAllData();

        avvCatalogues.forEach(avvCatalogue => {
            const catalogueNameKey = `avv${avvCatalogue.name}`;
            const catalogueDate = avvCatalogue.validFrom;
            const catalogueData = JSON.parse(avvCatalogue.data);

            this.cacheData[catalogueNameKey] =
                this.cacheData[catalogueNameKey] || {};
            this.cacheData[catalogueNameKey][catalogueDate] = catalogueData;
        });

        this.updateCatalogueDates();
    }

    private updateCatalogueDates() {
        const catalogueNames = Object.keys(this.cacheData);
        catalogueNames.forEach(catalogueName => {
            const catalogueDateStrs = Object.keys(
                this.cacheData[catalogueName]
            );
            const catalogueDates = catalogueDateStrs.map(catalogueDateStr => {
                const [year, month, day] = catalogueDateStr
                    .split('-')
                    .map(Number);
                return {
                    catalogueDateStr,
                    catalogueDateTime: new Date(year, month - 1, day).getTime()
                };
            });
            catalogueDates.sort(
                (dateA, dateB) =>
                    dateA.catalogueDateTime - dateB.catalogueDateTime
            );
            this.avvCatalogueDates[catalogueName] = catalogueDates;
        });
    }

    private findCatalogueDate(catalogueName: string, samplingDate: string) {
        const [day, month, year] = samplingDate.split('.').map(Number);
        const samplingDateTime = new Date(year, month - 1, day).getTime();

        const catalogueDates = this.avvCatalogueDates[catalogueName];
        let result;

        for (const catalogueDate of catalogueDates) {
            if (catalogueDate.catalogueDateTime <= samplingDateTime) {
                result = catalogueDate;
            } else {
                break;
            }
        }

        return result?.catalogueDateStr;
    }

    private latestCatalogueVersion(catalogueName: string) {
        const catalogueDates = this.avvCatalogueDates[catalogueName];

        if (catalogueDates && catalogueDates.length > 0) {
            const latestDate =
                catalogueDates[catalogueDates.length - 1].catalogueDateStr;
            return this.cacheData[catalogueName][latestDate];
        }
        return null;
    }

    private oldestCatalogueVersion(catalogueName: string) {
        const catalogueDates = this.avvCatalogueDates[catalogueName];

        if (catalogueDates && catalogueDates.length > 0) {
            const oldestDate = catalogueDates[0].catalogueDateStr;
            return this.cacheData[catalogueName][oldestDate];
        }
        return null;
    }
}

const avvCatalogueCache = new AVVCatalogueCache();

export { avvCatalogueCache, AVVCatalogueCache };
