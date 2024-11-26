import { AVVCatalogueInformationRepository } from './avv-catalogue-information.repository';
import { PathogenRepository } from './pathogen.repository';

const aVVCatalogueInformationRepository =
    new AVVCatalogueInformationRepository();
export { AVVCatalogueInformationRepository, aVVCatalogueInformationRepository };

const pathogenRepository = new PathogenRepository();
export { PathogenRepository, pathogenRepository };
