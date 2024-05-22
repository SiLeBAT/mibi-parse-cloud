import { EntityId } from '../../../shared/domain/valueObjects';
import { AbstractRepository } from '../../../shared/infrastructure/repositories';
import { UserInformation } from '../../domain';
import { UserInformationPersistenceMapper } from '../../mappers';
import {
    InstituteObject,
    ObjectKeys,
    UserInformationObject
} from '../parse-types';

class InnerInstituteRepo {
    async getObjectByEntityId(eId: EntityId): Promise<InstituteObject> {
        const query = new Parse.Query<InstituteObject>(ObjectKeys.Institute);
        const object = query.get(eId.value, {
            useMasterKey: true
        });
        if (object) {
            return object;
        }
        throw new Error(`InstituteObject with id ${eId} not found`);
    }
}

export class UserInformationRepository extends AbstractRepository<UserInformationObject> {
    private instituteRepo: InnerInstituteRepo = new InnerInstituteRepo();

    async getUserInformationByUserId(
        userId: EntityId
    ): Promise<UserInformation> {
        const tempUser = new Parse.User();
        tempUser.id = userId.value;
        const query = this.getQuery();
        query.equalTo('user', tempUser);
        const results: UserInformationObject[] = await query.find({
            useMasterKey: true
        });
        const userInformationObject = results[0];
        const institute = userInformationObject.get('institute');
        const instituteId = EntityId.create({ value: institute.id });
        const instituteObject = await this.instituteRepo.getObjectByEntityId(
            instituteId
        );
        const userInformation =
            UserInformationPersistenceMapper.toDomain(instituteObject);

        return userInformation;
    }
}
