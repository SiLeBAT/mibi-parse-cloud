import { Mapper } from '../../shared/mappers';
import { UserInformation, UserInformationProps } from '../domain';
import { InstituteObject } from '../infrastructure';
import { InstitutePersistenceMapper } from './institute-persistence.mapper';

export class UserInformationPersistenceMapper extends Mapper {
    public static toDomain(instituteObject: InstituteObject): UserInformation {
        try {
            const props: UserInformationProps = {
                institute: InstitutePersistenceMapper.toDomain(instituteObject)
            };
            return UserInformation.create(props);
        } catch (e) {
            console.error('could not construct Log Entry from Object.');
            throw e;
        }
    }
}
