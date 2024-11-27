import { User } from 'parse';
import { Email, Name } from '../../shared/domain/valueObjects';
import {
    InstituteObject,
    UserInformationObject
} from '../../shared/infrastructure/parse-types';
import { Mapper } from '../../shared/mappers';
import { Contact, Customer, CustomerProps } from '../domain';

import { Bundesland } from './../domain/enums';

export class CustomerPersistenceMapper extends Mapper {
    public static async toDomain(
        userObject: User,
        userInformationObject: UserInformationObject,
        instituteObject: InstituteObject
    ): Promise<Customer> {
        try {
            const contact = Contact.create({
                instituteName: instituteObject.get('name1'),
                street: instituteObject.get('address1').street,
                zip: instituteObject.get('zip'),
                city: instituteObject.get('city'),
                telephone: instituteObject.get('phone'),
                email: await Email.create({
                    value: userObject.get('email')
                }),
                stateShort:
                    Bundesland[
                        instituteObject.get(
                            'state_short'
                        ) as keyof typeof Bundesland
                    ]
            });
            const firstName = await Name.create({
                value: userInformationObject.get('firstName')
            });
            const lastName = await Name.create({
                value: userInformationObject.get('lastName')
            });
            const props: CustomerProps = {
                contact,
                firstName,
                lastName,
                customerRefNumber: ''
            };
            return Customer.create(props);
        } catch (e) {
            console.error('Could not construct Customer from Object.');
            throw e;
        }
    }
}
