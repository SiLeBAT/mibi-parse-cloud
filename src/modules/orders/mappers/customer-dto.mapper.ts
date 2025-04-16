import { Contact, Customer } from '../domain';

import { Email } from '../../shared/domain/valueObjects';
import { Mapper, MappingError } from '../../shared/mappers';
import { SampleSetMetaDTO } from '../dto/submission.dto';

export class CustomerDTOMapper extends Mapper {
    static async fromDTO(meta: SampleSetMetaDTO): Promise<Customer> {
        try {
            const props = {
                contact: Contact.create({
                    ...meta.sender,
                    email: await Email.create({
                        value: meta.sender.email
                    })
                }),
                customerRefNumber: meta.customerRefNumber || ''
            };

            return Customer.create(props);
        } catch (error) {
            throw new ToCustomerMappingError(
                'Unable to map CustomerDTO to Customer',
                error
            );
        }
    }
}

export class ToCustomerMappingError extends MappingError {}
