import { User } from 'parse';
import { Email, Name } from '../../shared/domain/valueObjects';
import { Mapper } from '../../shared/mappers';
import { Contact, Customer, CustomerProps } from '../domain';
import { InstituteObject } from '../infrastructure';
import { Bundesland } from './../domain/enums';
import { UserInformationObject } from './../infrastructure/parse-types';

export class CustomerPersistenceMapper extends Mapper {
    public static async toDomain(
        userObject: User,
        userInformationObject: UserInformationObject,
        instituteObject: InstituteObject
    ): Promise<Customer> {
        try {
            const props: CustomerProps = {
                contact: Contact.create({
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
                }),
                firstName: await Name.create({
                    value: userInformationObject.get('firstName')
                }),
                lastName: await Name.create({
                    value: userInformationObject.get('lastName')
                }),
                customerRefNumber: ''
            };
            return Customer.create(props);
        } catch (e) {
            console.error('Could not construct Log Entry from Object.');
            throw e;
        }
    }
}
