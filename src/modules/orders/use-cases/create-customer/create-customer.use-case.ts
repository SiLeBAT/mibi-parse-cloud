import { EntityId } from '../../../shared/domain/valueObjects';
import { UseCase } from '../../../shared/use-cases';
import { Customer } from '../../domain';
import {
    customerRepository,
    CustomerRepository
} from '../../infrastructure/repositories';

type CreateCustomerParams = {
    userId: EntityId;
};

export class CreateCustomerUseCase
    implements UseCase<CreateCustomerParams, Customer>
{
    constructor(private customerRepo: CustomerRepository) {}

    async execute({ userId }: CreateCustomerParams): Promise<Customer> {
        const userInformation: Customer =
            await this.customerRepo.getCustomerByUserId(userId);
        return userInformation;
    }
}

const createCustomer = new CreateCustomerUseCase(customerRepository);

export { createCustomer };
