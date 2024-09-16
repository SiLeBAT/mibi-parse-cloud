import { Contact, Customer } from '../domain';

import { Name } from '../../shared/domain/valueObjects';
import { Mapper, MappingError } from '../../shared/mappers';
import { Email } from '../../system-monitoring/domain';
import { Bundesland } from '../domain/enums';
import { SampleSetMetaDTO } from '../dto/submission.dto';

export class CustomerDTOMapper extends Mapper {
    static async fromDTO(meta: SampleSetMetaDTO): Promise<Customer> {
        try {
            const props = {
                contact: Contact.create({
                    ...meta.sender,
                    stateShort: Bundesland.UNKNOWN,
                    email: await Email.create({
                        value: meta.sender.email
                    })
                }),
                firstName: await Name.create({
                    value: meta.sender.contactPerson.split(' ')[0]
                }),
                lastName: await Name.create({
                    value: meta.sender.contactPerson.split(' ')[1]
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
