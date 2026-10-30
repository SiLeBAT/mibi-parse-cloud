import moment from 'moment';
import { compareVersions } from '../../../shared/infrastructure/cache/avvcatalog.cache';
import { UseCase } from '../../../shared/use-cases';
import { CatalogInformation } from '../../domain/catalog-information.vo';
import {
    aVVCatalogInformationRepository,
    AVVCatalogInformationRepository
} from '../../infrastructure/repository';

class CheckForCatalogSameValidFromUseCase
    implements UseCase<CatalogInformation, Promise<string | null>>
{
    constructor(
        private aVVCatalogInformationRepository: AVVCatalogInformationRepository
    ) {}

    // Returns a warning if catalogs with the same code and validFrom date but another version are stored
    async execute(
        catalogInformation: CatalogInformation
    ): Promise<string | null> {
        const storedCatalogs: CatalogInformation[] =
            await this.aVVCatalogInformationRepository.getAllEntriesWith({
                key: 'validFrom',
                value: catalogInformation.validFrom
            });
        const otherVersions = storedCatalogs
            .filter(
                catalog =>
                    catalog.catalogCode === catalogInformation.catalogCode &&
                    catalog.version !== catalogInformation.version
            )
            .map(catalog => catalog.version)
            .sort(compareVersions);

        if (otherVersions.length === 0) {
            return null;
        }

        const validFrom = moment
            .utc(catalogInformation.validFrom)
            .format('D MMM YYYY');
        return otherVersions
            .map(
                version =>
                    `There is already a catalog ${catalogInformation.catalogCode} with the version ${version} and the same valid from date ${validFrom} present`
            )
            .join('; ');
    }
}

const checkForCatalogSameValidFrom = new CheckForCatalogSameValidFromUseCase(
    aVVCatalogInformationRepository
);

export { checkForCatalogSameValidFrom };
