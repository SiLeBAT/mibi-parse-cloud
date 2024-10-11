import { AVVCatalog } from '../model/avvcatalog.entity';
import {
    AVVCatalogData,
    MibiCatalogData,
    MibiCatalogFacettenData,
    AVVCatalogObject
} from '../model/legacy.model';

function createAVVCatalog<T extends AVVCatalogData>(
    data: T,
    uId: string = ''
): AVVCatalog<T> {
    return new AVVCatalog(data, uId);
}

export class AVVCatalogRepository {
    private catalogs: {
        [key: string]: AVVCatalog<AVVCatalogData>;
    };
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
        // `zsp${new Date().getFullYear().toString()}`,
        // `zsp${(new Date().getFullYear() + 1).toString()}`,
        // `zsp${(new Date().getFullYear() - 1).toString()}`
    ];

    constructor() {
        this.catalogs = {};
    }

    async initialise(): Promise<void> {
        console.log(
            `${this.constructor.name}.${this.initialise.name}, loading AVV Catalog data from Database.`
        );
        const avvCatalogues = await this.retrieve();
        avvCatalogues.forEach(avvCatalogueObject => {
            try {
                const catalogName = avvCatalogueObject.catalogCode;
                const catalogData = JSON.parse(avvCatalogueObject.catalogData);
                const data: MibiCatalogData | MibiCatalogFacettenData =
                    catalogData['data'];
                const uId: string = catalogData['uId'];
                this.catalogs[`avv${catalogName}`] = createAVVCatalog(
                    data,
                    uId
                );
            } catch (error) {
                console.log(
                    `Error loading AVV catalog from database: ${error}`
                );
            }
        });
        this.requiredCatalogNames.forEach(catalogName => {
            if (
                !this.catalogs.hasOwnProperty.call(this.catalogs, catalogName)
            ) {
                console.error(
                    `Error: Required AVV Catalog ${catalogName} not found in Database.`
                );
            }
        });
        console.log(
            `${this.constructor.name}.${this.initialise.name}, finished initialising AVV Catalog Repository from Database.`
        );
    }

    getAVVCatalog<T extends AVVCatalogData>(
        catalogName: string
    ): AVVCatalog<T> {
        return this.catalogs[catalogName] as AVVCatalog<T>;
    }

    private async retrieve(): Promise<AVVCatalogObject[]> {
        const query = new Parse.Query('AVV_Catalogue');
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

let repo: AVVCatalogRepository;

export async function initialiseRepository(): Promise<AVVCatalogRepository> {
    const repository = repo ? repo : new AVVCatalogRepository();
    repo = repository;
    return repository.initialise().then(() => repository);
}
