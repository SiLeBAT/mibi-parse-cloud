import { AVVCatalogInformationRepository } from './avv-catalog-information.repository';
import { PathogenRepository } from './pathogen.repository';

const aVVCatalogInformationRepository = new AVVCatalogInformationRepository();
export { AVVCatalogInformationRepository, aVVCatalogInformationRepository };

const pathogenRepository = new PathogenRepository();
export { PathogenRepository, pathogenRepository };
