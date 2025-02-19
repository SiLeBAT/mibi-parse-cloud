import { logger } from '../../../system/logging';
export async function mp26CheckUserInfoLink() {
    const query_User = new Parse.Query(Parse.User);
    const users = await query_User.find({ useMasterKey: true });

    users.forEach(async user => {
        const queryUserInfo = new Parse.Query('User_Info');
        queryUserInfo.equalTo('user', user);
        const userInfo = await queryUserInfo.find({ useMasterKey: true });

        if (userInfo.length > 0) {
            logger.verbose(
                'CreateUserInfoLink: User Info already exists for user id: ' +
                    user.id
            );
            return;
        }
        const queryUsers = new Parse.Query('users');
        const userEmail = user.getEmail();

        if (userEmail === undefined) {
            logger.warn(
                'CreateUserInfoLink: No email found in users collection for user id:  ' +
                    user.id
            );
            return;
        }

        queryUsers.matches('email', RegExp(userEmail), 'i');
        const old_user = await queryUsers.find({ useMasterKey: true });
        if (old_user.length !== 1) {
            logger.warn(
                'CreateUserInfoLink: No unique entry found in users collection for user id:  ' +
                    user.id
            );
            return;
        }

        const newUserInfo = new Parse.Object('User_Info');
        newUserInfo.set('user', user);
        newUserInfo.set('institute', old_user[0]!.get('institution'));
        newUserInfo.set('firstName', old_user[0]!.get('firstName'));
        newUserInfo.set('lastName', old_user[0]!.get('lastName'));

        newUserInfo.save(null, { useMasterKey: true });
    });
    return true;
}
