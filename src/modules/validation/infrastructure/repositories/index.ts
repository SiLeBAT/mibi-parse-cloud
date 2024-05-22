import { ObjectKeys } from '../parse-types';
import { UserInformationRepository } from './user-information.repository';

const userInformationRepository = new UserInformationRepository(
    ObjectKeys.UserInformation
);

export { UserInformationRepository, userInformationRepository };
