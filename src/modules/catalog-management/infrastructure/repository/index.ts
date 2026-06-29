import { AVVCatalogInformationRepository } from './avv-catalog-information.repository';
import { NRLRepository } from './nrl.repository';
import { PathogenRepository } from './pathogen.repository';
import { ZomoPlanInformationRepository } from './zomo-plan-information.repository';
import { ZomoPlanFileInformationRepository } from './zomo-plan-file-information.repository';

const aVVCatalogInformationRepository = new AVVCatalogInformationRepository();
export { AVVCatalogInformationRepository, aVVCatalogInformationRepository };

const pathogenRepository = new PathogenRepository();
export { PathogenRepository, pathogenRepository };

const nrlRepository = new NRLRepository();
export { NRLRepository, nrlRepository };

const zomoPlanInformationRepository = new ZomoPlanInformationRepository();
export { ZomoPlanInformationRepository, zomoPlanInformationRepository };

const zomoPlanFileInformationRepository =
    new ZomoPlanFileInformationRepository();
export { ZomoPlanFileInformationRepository, zomoPlanFileInformationRepository };
