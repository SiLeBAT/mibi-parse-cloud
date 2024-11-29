import { ObjectKeys } from '../../../shared/infrastructure/parse-types';
import { CustomerRepository } from './customer.repository';
import { UserRepository } from './user.repository';
import { AVVCatalogueRepository } from './avvcatalogue.repository';
import { SearchAliasRepository } from './search-alias.repository';
import { PLZRepository } from './plz.repository';
import { NRLRepository } from './nrl.repository';
const customerRepository = new CustomerRepository(ObjectKeys.UserInformation);
const userRepository = new UserRepository();
const avvCatalogueRepository = new AVVCatalogueRepository(
    ObjectKeys.AVVCatalogue
);
const searchAliasRepository = new SearchAliasRepository(ObjectKeys.SearchAlias);
const nrlRepository = new NRLRepository(ObjectKeys.NRL);
const plzRepository = new PLZRepository(ObjectKeys.AllowedPLZ);

export {
    CustomerRepository,
    customerRepository,
    userRepository,
    UserRepository,
    nrlRepository,
    NRLRepository,
    PLZRepository,
    plzRepository,
    avvCatalogueRepository,
    AVVCatalogueRepository,
    searchAliasRepository,
    SearchAliasRepository
};
