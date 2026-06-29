import type { User } from 'parse';
import { Email, EntityId } from '../../../shared/domain/valueObjects';

export class UserRepository {
    async getIdForEmail(email: Email): Promise<EntityId> {
        const query = new Parse.Query<User>(Parse.User);

        query.equalTo('email', email.value);
        const userObject = await query.first({
            useMasterKey: true
        });

        if (userObject && userObject.id) {
            return EntityId.create({ value: userObject.id });
        }
        throw new Error(`User with email ${email.value} not found`);
    }

    async isDataSaveAgreed(userId: EntityId): Promise<boolean> {
        const userPointer = new Parse.User();
        userPointer.id = userId.value;

        const userInfo = await new Parse.Query('User_Info')
            .equalTo('user', userPointer)
            .first({ useMasterKey: true });

        return userInfo?.get('dataSaveAgreed') ?? false;
    }
}
