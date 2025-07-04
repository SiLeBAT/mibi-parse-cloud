import { CatalogData } from '..//model/legacy.model';
import { Catalog, createCatalog } from '../model/catalog.entity';
import { loadJSONFile } from './file-loader';

export class CatalogRepository {
    private catalogs: {
        [key: string]: Catalog<CatalogData>;
    };
    private catalogNames: string[] = [];

    constructor(private dataDir: string) {
        this.catalogs = {};
    }

    async initialise(): Promise<void> {
        console.log(
            `${this.constructor.name}.${this.initialise.name}, loading Catalog data from Filesystem.`
        );

        await Promise.all(
            this.catalogNames.map(async catalogName => {
                return loadJSONFile(`${catalogName}.json`, this.dataDir)
                    .then((jsonData: { data: CatalogData[]; uId: string }) => {
                        this.catalogs[catalogName] = createCatalog(
                            jsonData.data,
                            jsonData.uId
                        );
                        return;
                    })
                    .catch(error => {
                        console.log(
                            `mibi-cloud: Error loading catalog from json file: ${error}`
                        );
                    });
            })
        ).then(() => {
            console.log(
                `mibi-cloud: ${this.constructor.name}.${this.initialise.name}, finished initialising Catalog Repository from Filesystem.`
            );
        });
    }

    getCatalog<T extends CatalogData>(catalogName: string): Catalog<T> {
        return this.catalogs[catalogName] as Catalog<T>;
    }
}

export async function initialiseRepository(
    dataDir: string
): Promise<CatalogRepository> {
    return new CatalogRepository(dataDir);
}
