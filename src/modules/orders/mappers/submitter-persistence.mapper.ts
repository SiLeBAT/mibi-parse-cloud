import { User } from 'parse';
import { Email, EntityId, Name } from '../../shared/domain/valueObjects';
import {
    InstituteObject,
    UserInformationObject
} from '../../shared/infrastructure/parse-types';
import { Mapper } from '../../shared/mappers';
import { AffiliatedInstitute, Submitter, SubmitterProps } from '../domain';

import { Bundesland } from '../domain/enums';

export class SubmitterPersistenceMapper extends Mapper {
    public static async toDomain(
        userObject: User,
        userInformationObject: UserInformationObject,
        instituteObject: InstituteObject
    ): Promise<Submitter> {
        try {
            const institute = AffiliatedInstitute.create({
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
            const props: SubmitterProps = {
                institute,
                firstName,
                lastName,
                submitterId: EntityId.create({ value: userObject.id })
            };
            return Submitter.create(props);
        } catch (e) {
            console.error('Could not construct Submitter from Object.');
            throw e;
        }
    }
}
