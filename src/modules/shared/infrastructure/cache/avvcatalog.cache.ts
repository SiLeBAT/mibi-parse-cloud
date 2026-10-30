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

type AVVCatalogVersions = {
    [key: string]: {
        [key: string]: string;
    };
};

// Compares version strings segment by segment as integers, e.g. 9.10 > 9.9
function compareVersions(versionA: string, versionB: string): number {
    const toSegments = (version: string) =>
        version.split('.').map(segment => Number(segment) || 0);
    const segmentsA = toSegments(versionA);
    const segmentsB = toSegments(versionB);
    const length = Math.max(segmentsA.length, segmentsB.length);

    for (let i = 0; i < length; i++) {
        const difference = (segmentsA[i] ?? 0) - (segmentsB[i] ?? 0);
        if (difference !== 0) {
            return difference;
        }
    }
    return 0;
}

class AVVCatalogCache {
    private cacheData: AVVCatalogCacheData = {};
    private avvCatalogDates: AVVCatalogDates = {};
    private avvCatalogVersions: AVVCatalogVersions = {};

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
        this.avvCatalogVersions = {};
    }

    private updateCacheData(avvCatalogs: AVVCatalog[]) {
        this.removeAllData();

        avvCatalogs.forEach(avvCatalog => {
            const catalogNameKey = `avv${avvCatalog.name}`;
            const catalogDate = avvCatalog.validFrom;
            this.cacheData[catalogNameKey] =
                this.cacheData[catalogNameKey] || {};
            this.avvCatalogVersions[catalogNameKey] =
                this.avvCatalogVersions[catalogNameKey] || {};

            // Several catalogs can share a validFrom date: keep the highest version
            const storedVersion =
                this.avvCatalogVersions[catalogNameKey][catalogDate];
            if (
                storedVersion !== undefined &&
                compareVersions(avvCatalog.version, storedVersion) <= 0
            ) {
                return;
            }

            this.cacheData[catalogNameKey][catalogDate] = JSON.parse(
                avvCatalog.data
            );
            this.avvCatalogVersions[catalogNameKey][catalogDate] =
                avvCatalog.version;
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
                    catalogDateTime: Date.UTC(year, month - 1, day)
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
        const samplingDateTime = Date.UTC(year, month - 1, day);

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

export { avvCatalogCache, AVVCatalogCache, compareVersions };
