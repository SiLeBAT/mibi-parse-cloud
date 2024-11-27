import { EntityId } from '../../../shared/domain/valueObjects';
import { UseCase } from '../../../shared/use-cases';
import { ValidationOptions } from '../../domain/validation-parameter.vo';
import { createCustomer } from '../create-customer';

type CreateValidationOptionsParams = {
    submitterId: EntityId | null;
};

export class CreateValidationOptionsUseCase
    implements UseCase<CreateValidationOptionsParams, ValidationOptions>
{
    constructor() {}

    async execute({
        submitterId
    }: CreateValidationOptionsParams): Promise<ValidationOptions> {
        const options = {
            state: ''
        };
        if (submitterId !== null) {
            try {
                const customer = await createCustomer.execute({
                    userId: submitterId
                });
                options.state = customer.getStateAbbreviation();
            } catch (error) {
                console.error(
                    `Unable to retrieve user information for user: ${submitterId.value}. Ignoring state information.`
                );
                options.state = '';
            }
        }
        return options;
    }
}

const createValidationOptions = new CreateValidationOptionsUseCase();

export { createValidationOptions };
