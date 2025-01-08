import * as _ from 'lodash';
import { UseCase } from '../../../shared/use-cases';
import { aVVCatalogInformationRepository } from '../../infrastructure/repository';
import { CatalogInformation } from '../../domain/catalog-information.vo';
import { AVVCatalogInformationRepository } from '../../infrastructure/repository';

class CheckForCatalogDuplicationUseCase
    implements UseCase<CatalogInformation, boolean>
{
    constructor(
        private aVVCatalogInformationRepository: AVVCatalogInformationRepository
    ) {}

    async execute(catalogInformation: CatalogInformation): Promise<boolean> {
        const storedCatalogs: CatalogInformation[] =
            await this.aVVCatalogInformationRepository.getAllEntriesWith({
                key: 'validFrom',
                value: catalogInformation.validFrom
            });
        const catalogsWithRightVersion = _.filter(storedCatalogs, {
            version: catalogInformation.version
        });
        const catalogsWithRightCode = _.filter(catalogsWithRightVersion, {
            catalogCode: catalogInformation.catalogCode
        });
        return catalogsWithRightCode.length > 0;
    }
}

const checkForCatalogDuplication = new CheckForCatalogDuplicationUseCase(
    aVVCatalogInformationRepository
);

export { checkForCatalogDuplication };
