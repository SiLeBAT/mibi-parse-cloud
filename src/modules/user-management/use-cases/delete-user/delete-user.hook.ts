import {
    getLogger,
    setLoggingContext
} from '../../../shared/core/logging-context';
import { ParseHookRequest } from '../../../shared/infrastructure';
import { userInformationRepository } from '../../infrastructure/repositories';

type AfterDeleteUserHookRequest = ParseHookRequest<Parse.User, void>;

export const afterDeleteUserHook = async (
    request: AfterDeleteUserHookRequest
) => {
    try {
        setLoggingContext(request.log);
        userInformationRepository.deleteAllEntriesForUser(request.object);
    } catch (error) {
        getLogger().error(
            'Error finding related User Information ' +
                error.code +
                ': ' +
                error.message
        );
    } finally {
        setLoggingContext(null);
    }
};
