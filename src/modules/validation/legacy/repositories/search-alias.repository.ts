import { SearchAlias } from '../model/legacy.model';
import { loadJSONFile } from './file-loader';

export class SearchAliasRepository {
    private fileName = 'search-alias.json';

    private aliases: SearchAlias[] = [];

    constructor(private dataDir: string) {}

    async initialise(): Promise<void> {
        console.log(
            `${this.constructor.name}.${this.initialise.name}, loading Search Alias data from Filesystem.`
        );

        return loadJSONFile(this.fileName, this.dataDir)
            .then(
                // tslint:disable-next-line:no-any
                (data: SearchAlias[]) => {
                    this.aliases = data;
                },
                (error: Error) => {
                    throw error;
                }
            )
            .then(() => {
                console.log(
                    `${this.constructor.name}.${this.initialise.name}, finished initialising Search Alias Repository from Filesystem.`
                );
            });
    }

    getAliases() {
        return this.aliases;
    }
}
let repo: SearchAliasRepository;

export async function initialiseRepository(
    dataDir: string
): Promise<SearchAliasRepository> {
    const repository = repo ? repo : new SearchAliasRepository(dataDir);
    repo = repository;
    return repository.initialise().then(() => repository);
}
