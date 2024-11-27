import * as _ from 'lodash';
import { UseCase } from '../../../shared/use-cases';
import { aVVCatalogueInformationRepository } from '../../infrastructure/repository';
import { CatalogueInformation } from './../../domain/catalogue-information.vo';
import { AVVCatalogueInformationRepository } from './../../infrastructure/repository';

class CheckForCatalogueDuplicationUseCase
    implements UseCase<CatalogueInformation, boolean>
{
    constructor(
        private aVVCatalogueInformationRepository: AVVCatalogueInformationRepository
    ) {}

    async execute(
        catalogueInformation: CatalogueInformation
    ): Promise<boolean> {
        const storedCatalogues: CatalogueInformation[] =
            await this.aVVCatalogueInformationRepository.getAllEntriesWith({
                key: 'validFrom',
                value: catalogueInformation.validFrom
            });
        const cataloguesWithRightVersion = _.filter(storedCatalogues, {
            version: catalogueInformation.version
        });
        const cataloguesWithRightCode = _.filter(cataloguesWithRightVersion, {
            catalogueCode: catalogueInformation.catalogueCode
        });
        return cataloguesWithRightCode.length > 0;
    }
}

const checkForCatalogueDuplication = new CheckForCatalogueDuplicationUseCase(
    aVVCatalogueInformationRepository
);

export { checkForCatalogueDuplication };
