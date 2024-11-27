import { AbstractRepository } from '../../../shared/infrastructure';
import {
    ObjectKeys,
    UserInformationObject
} from '../../../shared/infrastructure/parse-types';

export class UserInformationRepository extends AbstractRepository<UserInformationObject> {
    deleteAllEntriesForUser(user: Parse.User) {
        const query = this.getQuery();
        query.equalTo('user', user);
        query.find().then(Parse.Object.destroyAll);
    }
}

const userInformationRepository = new UserInformationRepository(
    ObjectKeys.UserInformation
);

export { userInformationRepository };
