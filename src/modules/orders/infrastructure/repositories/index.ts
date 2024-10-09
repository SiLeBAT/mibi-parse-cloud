import { ObjectKeys } from '../../../shared/infrastructure/parse-types';
import { CustomerRepository } from './customer.repository';
import { PLZRepository } from './plz.repository';
import { UserRepository } from './user.repository';

const plzRepository = new PLZRepository(ObjectKeys.AllowedPLZ);
const customerRepository = new CustomerRepository(ObjectKeys.UserInformation);
const userRepository = new UserRepository();

export {
    CustomerRepository,
    customerRepository,
    plzRepository,
    PLZRepository,
    userRepository,
    UserRepository
};
