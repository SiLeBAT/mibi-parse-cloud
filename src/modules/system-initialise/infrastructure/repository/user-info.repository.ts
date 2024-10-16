import { AbstractRepository } from '../../../shared/infrastructure';
import {
    ObjectKeys,
    UserInformationObject
} from '../../../shared/infrastructure/parse-types';

export class UserInformationRepository extends AbstractRepository<UserInformationObject> {}

const userInformationRepository = new UserInformationRepository(
    ObjectKeys.UserInformation
);

export { userInformationRepository };
