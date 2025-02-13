import { uniq } from 'lodash';
import { logger } from '../../../../system/logging';
import { ObjectKeys } from '../../../shared/infrastructure/parse-types';
import { UseCase } from '../../../shared/use-cases';
import { AVVCatalogRepository } from '../../infrastructure';
class CheckAVVCollectionCompletenessUseCase implements UseCase<null, null> {
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

    private avvCatalogRepository = new AVVCatalogRepository(
        ObjectKeys.AVVCatalog
    );
    constructor() {}

    async execute(): Promise<null> {
        try {
            const avvCatalogs = await this.avvCatalogRepository.retrieve();

            const uniqueCatalogNames = uniq(
                avvCatalogs.map(catalog => `avv${catalog.name}`)
            );
            const absentCatalogsInDB = this.requiredCatalogNames.filter(
                catalogName => !uniqueCatalogNames.includes(catalogName)
            );

            if (absentCatalogsInDB.length > 0) {
                logger.error(
                    `Error: Required AVV Catalog(s) ${absentCatalogsInDB.join(
                        ', '
                    )} not found in Database.`
                );
            }
        } catch (error) {
            logger.error(
                'Serious error: Unable to check AVV Collections for completeness'
            );
        }

        return null;
    }
}

const checkAVVCollectionCompleteness =
    new CheckAVVCollectionCompletenessUseCase();

export { checkAVVCollectionCompleteness };
