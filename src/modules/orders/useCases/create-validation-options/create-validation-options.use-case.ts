import { EntityId } from '../../../shared/domain/valueObjects';
import { UseCase } from '../../../shared/useCases';
import { ValidationOptions } from '../../domain/validation-parameter.vo';
import { createCustomer } from '../create-customer';

type CreateValidationOptionsParams = {
    userId: EntityId | null;
};

export class CreateValidationOptionsUseCase
    implements UseCase<CreateValidationOptionsParams, ValidationOptions>
{
    constructor() {}

    async execute({
        userId
    }: CreateValidationOptionsParams): Promise<ValidationOptions> {
        const options = {
            state: ''
        };
        if (userId !== null) {
            try {
                const customer = await createCustomer.execute({
                    userId
                });
                options.state = customer.getStateAbbreviation();
            } catch (error) {
                console.error(
                    `Unable to retrieve user information for user: ${userId.value}. Ignoring state information.`
                );
                options.state = '';
            }
        }
        return options;
    }
}

const createValidationOptions = new CreateValidationOptionsUseCase();

export { createValidationOptions };
