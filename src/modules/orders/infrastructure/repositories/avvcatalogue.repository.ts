import { AbstractRepository } from '../../../shared/infrastructure';
import { AVVCatalogueObject } from '../../../shared/infrastructure/parse-types';
import { AVVCatalog } from '../../legacy/model/avvcatalog.entity';
import {
    AVVCatalogData,
    MibiCatalogData,
    MibiCatalogFacettenData,
    AVVCatalogObject
} from '../../legacy/model/legacy.model';

function createAVVCatalog<T extends AVVCatalogData>(
    data: T,
    uId: string = ''
): AVVCatalog<T> {
    return new AVVCatalog(data, uId);
}

export type AVVCatalogueCacheData = {
    [key: string]: AVVCatalog<AVVCatalogData>;
};

export class AVVCatalogueRepository extends AbstractRepository<AVVCatalogueObject> {
    private requiredCatalogNames: string[] = [
        'avv303',
        'avv313',
        'avv316',
        'avv319',
        'avv322',
        'avv324',
        'avv326',
        'avv328',
        'avv339'
    ];

    async retrieve(): Promise<AVVCatalogueCacheData> {
        console.log(
            `${this.constructor.name}.${this.retrieve.name}, loading AVV Catalog data from Database.`
        );

        const catalogs: AVVCatalogueCacheData = {};

        const avvCatalogues = await this.retrieveAllCatalogues();

        avvCatalogues.forEach(avvCatalogueObject => {
            try {
                const catalogName = avvCatalogueObject.catalogCode;
                const catalogData = JSON.parse(avvCatalogueObject.catalogData);
                const data: MibiCatalogData | MibiCatalogFacettenData =
                    catalogData['data'];
                const uId: string = catalogData['uId'];

                const avvCatalogue = createAVVCatalog(data, uId);
                catalogs[`avv${catalogName}`] = avvCatalogue;
            } catch (error) {
                console.log(
                    `AVVCatalogueRepository, retrieve(), Error loading AVV catalog data from Database: ${error}`
                );
            }
        });

        this.requiredCatalogNames.forEach(catalogName => {
            if (!catalogs.hasOwnProperty.call(catalogs, catalogName)) {
                console.error(
                    `Error: Required AVV Catalog ${catalogName} not found in Database.`
                );
            }
        });

        console.log(
            `${this.constructor.name}.${this.retrieve.name}, finished loading AVV Catalog data from Database.`
        );

        return catalogs;
    }

    private async retrieveAllCatalogues(): Promise<AVVCatalogObject[]> {
        const query = this.getQuery();
        query.ascending('catalogueCode');
        const catalogues: Parse.Object[] = await query.find({
            useMasterKey: true
        });
        return catalogues.map(avvCatalog => this.mapToAVVCatalog(avvCatalog));
    }
    private mapToAVVCatalog(avvCatalog: Parse.Object): AVVCatalogObject {
        return {
            catalogCode: avvCatalog.get('catalogueCode'),
            version: avvCatalog.get('version'),
            validFrom: avvCatalog.get('validFrom'),
            catalogData: avvCatalog.get('catalogueData')
        };
    }
}
