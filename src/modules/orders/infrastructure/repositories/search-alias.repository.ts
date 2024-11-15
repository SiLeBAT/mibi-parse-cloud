import { SearchAlias } from '../../../shared/domain/valueObjects/search-alias.vo';
import { AbstractRepository } from '../../../shared/infrastructure';
import { SearchAliasObject } from '../../../shared/infrastructure/parse-types';
import { logger } from '../../../../system/logging';

export class SearchAliasRepository extends AbstractRepository<SearchAliasObject> {
    async retrieve(): Promise<SearchAlias[]> {
        logger.info(
            `${this.constructor.name}.${this.retrieve.name}, loading Search-Alias data from Database.`
        );

        const query = this.getQuery();
        const allSearchAliase = await query.findAll({ useMasterKey: true });

        const searchAliase = Promise.all(
            allSearchAliase.map(searchAlias =>
                this.mapToSearchAlias(searchAlias)
            )
        );

        logger.info(
            `${this.constructor.name}.${this.retrieve.name}, finished loading Search-Alias data from Database.`
        );

        return searchAliase;
    }

    private async mapToSearchAlias(
        searchAlias: SearchAliasObject
    ): Promise<SearchAlias> {
        return await SearchAlias.create({
            catalog: searchAlias.get('catalog'),
            token: searchAlias.get('token'),
            alias: searchAlias.get('alias')
        });
    }
}
