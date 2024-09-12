import { User } from 'parse';
import { Email, EntityId } from '../../../shared/domain/valueObjects';


export class UserRepository {
    async getIdForEmail(email: Email): Promise<EntityId> {
        const query = new Parse.Query<User>(User);
        query.equalTo("email", email.value);
        const userObject = await query.first({
            useMasterKey: true
        });

        if (userObject) {
            return EntityId.create({ value: userObject.id });
        }
        throw new Error(`User with email ${email.value} not found`);
    }
}
