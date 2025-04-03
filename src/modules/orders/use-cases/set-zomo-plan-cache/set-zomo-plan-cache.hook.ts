import { setZomoPlanCache } from './set-zomo-plan-cache.use-case';
import {
    getLogger,
    setLoggingContext
} from '../../../shared/core/logging-context';
import { ParseHookRequest } from '../../../shared/infrastructure';
import { ZomoPlanObject } from '../../../shared/infrastructure/parse-types';
type ZomoPlanSaveContext = Record<string, unknown>;
type AfterZomoPlanSaveHookRequest = ParseHookRequest<
    ZomoPlanObject,
    ZomoPlanSaveContext
>;

export const afterSaveZomoPlanHook = async (
    request: AfterZomoPlanSaveHookRequest
) => {
    request.log.info(
        'Changes made to Zomo_Plan Collection. Updating cache and deleting json file.'
    );

    const zomoPlanObject: ZomoPlanObject = request.object;
    const jsonFile = zomoPlanObject.get('zomoFile');
    try {
        setLoggingContext(request.log);
        destroyFile(jsonFile);
    } catch (error) {
        getLogger().error(error.message);
        throw error;
    } finally {
        setLoggingContext(null);
    }

    setZomoPlanCache.execute();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const afterDeleteZomoPlanHook = (request: any) => {
    request.log.info(
        'Entry deleted from Zomo_Plan Collection. Updating cache.'
    );

    setZomoPlanCache.execute();
};

function destroyFile(file: Parse.File) {
    try {
        file.destroy({ useMasterKey: true });
    } catch (error) {
        getLogger().error(error.message);
    }
}
