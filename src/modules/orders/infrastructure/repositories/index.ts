import { ObjectKeys } from '../parse-types';
import { CustomerRepository } from './customer.repository';
import { UserRepository } from './user.repository';

const customerRepository = new CustomerRepository(ObjectKeys.UserInformation);
const userRepository = new UserRepository();

export { CustomerRepository, customerRepository, userRepository, UserRepository };
