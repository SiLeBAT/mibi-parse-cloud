import { ObjectKeys } from '../../../shared/infrastructure/parse-types';
import { CustomerRepository } from './customer.repository';
import { UserRepository } from './user.repository';
import { AVVCatalogueRepository } from './avvcatalogue.repository';

const customerRepository = new CustomerRepository(ObjectKeys.UserInformation);
const userRepository = new UserRepository();
const avvCatalogueRepository = new AVVCatalogueRepository(
    ObjectKeys.AVVCatalogue
);

export {
    CustomerRepository,
    customerRepository,
    userRepository,
    UserRepository,
    avvCatalogueRepository,
    AVVCatalogueRepository
};
