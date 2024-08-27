import { User } from 'parse';
import { EntityId } from '../../../shared/domain/valueObjects';
import { AbstractRepository } from '../../../shared/infrastructure/repositories';
import { Customer } from '../../domain';
import { CustomerPersistenceMapper } from '../../mappers';
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

class InnerUserRepo {
    async getObjectByEntityId(eId: EntityId): Promise<User> {
        const query = new Parse.Query<User>(User);
        const object = query.get(eId.value, {
            useMasterKey: true
        });
        if (object) {
            return object;
        }
        throw new Error(`User with id ${eId} not found`);
    }
}

export class CustomerRepository extends AbstractRepository<UserInformationObject> {
    private instituteRepo: InnerInstituteRepo = new InnerInstituteRepo();
    private userRepo: InnerUserRepo = new InnerUserRepo();
    async getCustomerByUserId(userId: EntityId): Promise<Customer> {
        const tempUser = new Parse.User();
        tempUser.id = userId.value;
        const userObject = await this.userRepo.getObjectByEntityId(userId);
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
        const customer = CustomerPersistenceMapper.toDomain(
            userObject,
            userInformationObject,
            instituteObject
        );

        return customer;
    }
}
