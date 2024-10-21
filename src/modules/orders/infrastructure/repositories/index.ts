import { ObjectKeys } from '../../../shared/infrastructure/parse-types';
import { CustomerRepository } from './customer.repository';
import { PLZRepository } from './plz.repository';
import { UserRepository } from './user.repository';
import { AVVCatalogueRepository } from './avvcatalogue.repository';

const plzRepository = new PLZRepository(ObjectKeys.AllowedPLZ);
const customerRepository = new CustomerRepository(ObjectKeys.UserInformation);
const userRepository = new UserRepository();
const avvCatalogueRepository = new AVVCatalogueRepository(
    ObjectKeys.AVVCatalogue
);

// console.log('@@@@@@@@ orders/infrastructure/repositories/index new AVVCatalogueRepository(ObjectKeys.AVVCatalogue)')

export {
    CustomerRepository,
    customerRepository,
    plzRepository,
    PLZRepository,
    userRepository,
    UserRepository,
    avvCatalogueRepository,
    AVVCatalogueRepository
};
