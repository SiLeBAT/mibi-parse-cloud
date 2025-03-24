import { AVVCatalogInformationRepository } from './avv-catalog-information.repository';
import { PathogenRepository } from './pathogen.repository';
import { ZomoPlanInformationRepository } from './zomo-plan-information.repository';

const aVVCatalogInformationRepository = new AVVCatalogInformationRepository();
export { AVVCatalogInformationRepository, aVVCatalogInformationRepository };

const pathogenRepository = new PathogenRepository();
export { PathogenRepository, pathogenRepository };

const zomoPlanInformationRepository = new ZomoPlanInformationRepository();
export { ZomoPlanInformationRepository, zomoPlanInformationRepository };
