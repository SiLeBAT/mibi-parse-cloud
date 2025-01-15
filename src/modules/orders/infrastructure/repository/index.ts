import { ObjectKeys } from '../../../shared/infrastructure/parse-types';
import { AVVCatalogRepository } from './avvcatalog.repository';
import { NRLRepository } from './nrl.repository';
import { PLZRepository } from './plz.repository';
import { SearchAliasRepository } from './search-alias.repository';
import { SubmitterRepository } from './submitter.repository';
import { UserRepository } from './user.repository';
const submitterRepository = new SubmitterRepository(ObjectKeys.UserInformation);
const userRepository = new UserRepository();
const avvCatalogRepository = new AVVCatalogRepository(ObjectKeys.AVVCatalog);
const searchAliasRepository = new SearchAliasRepository(ObjectKeys.SearchAlias);
const nrlRepository = new NRLRepository(ObjectKeys.NRL);
const plzRepository = new PLZRepository(ObjectKeys.AllowedPLZ);

export {
    avvCatalogRepository,
    AVVCatalogRepository,
    nrlRepository,
    NRLRepository,
    PLZRepository,
    plzRepository,
    searchAliasRepository,
    SearchAliasRepository,
    submitterRepository,
    SubmitterRepository,
    userRepository,
    UserRepository
};
