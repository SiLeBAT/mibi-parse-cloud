import { ObjectKeys } from '../parse-types';
import { CustomerRepository } from './customer.repository';

const customerRepository = new CustomerRepository(ObjectKeys.UserInformation);

export { CustomerRepository, customerRepository };
