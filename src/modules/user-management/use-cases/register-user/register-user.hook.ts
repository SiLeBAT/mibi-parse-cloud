import {
    getLogger,
    setLoggingContext
} from '../../../shared/core/logging-context';
import { ParseHookRequest } from '../../../shared/infrastructure';
import { instituteRepository } from '../../infrastructure';

type BeforeSaveUserHookRequest = ParseHookRequest<
    Parse.User,
    Record<string, unknown>
>;

type AfterSaveUserHookRequest = ParseHookRequest<
    Parse.User,
    Record<string, unknown>
>;

type UserInfo = {
    firstName: string;
    lastName: string;
    instituteId: string;
};

export const beforeSaveUserHook = async (
    request: BeforeSaveUserHookRequest
) => {
    // Keycloak-materialized _User rows carry a keycloakSub; the legacy
    // registration hook would otherwise strip materialize()'s fields.
    if (request.object.get('keycloakSub')) {
        return;
    }
    try {
        setLoggingContext(request.log);
        const registrationDetails = request.object;
        const userInfo = getUserInfo(registrationDetails);
        request.context = userInfo;
        const userObject = createUserObject(registrationDetails);
        request.object = userObject;
    } catch (error) {
        getLogger().error(
            'Error setting related User Information ' +
                error.code +
                ': ' +
                error.message
        );
    } finally {
        setLoggingContext(null);
    }
};

export const afterSaveUserHook = async (request: AfterSaveUserHookRequest) => {
    // Keycloak-materialized saves leave request.context undefined (beforeSave sentinel
    // skipped the legacy staging). materialize() owns User_Info creation in that path.
    if (!request.context) {
        return;
    }
    try {
        setLoggingContext(request.log);
        const userInfo = request.context as UserInfo;
        if (userInfo.instituteId && userInfo.firstName && userInfo.lastName) {
            saveUserInfo(userInfo, request.object);
        } else {
            getLogger().warn(
                `Error setting related User Information for user ${request.object.id}:` +
                    'Missing required fields'
            );
        }
    } catch (error) {
        getLogger().error(
            'Error setting related User Information ' +
                error.code +
                ': ' +
                error.message
        );
    } finally {
        setLoggingContext(null);
    }
};

async function saveUserInfo(userInfo: UserInfo, user: Parse.User) {
    const instituteObject = await instituteRepository.getInstituteById(
        userInfo.instituteId
    );
    const newUserInfoObject = new Parse.Object('User_Info');
    newUserInfoObject.set('user', user);
    newUserInfoObject.set('institute', instituteObject);
    newUserInfoObject.set('firstName', userInfo.firstName);
    newUserInfoObject.set('lastName', userInfo.lastName);
    newUserInfoObject.save(null, { useMasterKey: true });
}

function getUserInfo(registrationDetails: Parse.User): UserInfo {
    return {
        firstName: registrationDetails.get('firstName'),
        lastName: registrationDetails.get('lastName'),
        instituteId: registrationDetails.get('institution')
    };
}

function createUserObject(registrationDetails: Parse.User) {
    const newUser = new Parse.User();
    newUser.set('username', registrationDetails.get('username'));
    newUser.set('password', registrationDetails.get('password'));
    newUser.set('email', registrationDetails.get('email'));
    return newUser;
}
