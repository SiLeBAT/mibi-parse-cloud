import { setAVVCatalogCache } from './set-avvcatalog-cache.use-case';
import {
    getLogger,
    setLoggingContext
} from '../../../shared/core/logging-context';
import { ParseHookRequest } from '../../../shared/infrastructure';
import { AVVCatalogObject } from '../../../shared/infrastructure/parse-types';
type AVVCatalogSaveContext = Record<string, unknown>;
type AfterAVVCatalogSaveHookRequest = ParseHookRequest<
    AVVCatalogObject,
    AVVCatalogSaveContext
>;

export const afterSaveAVVCatalogHook = async (
    request: AfterAVVCatalogSaveHookRequest
) => {
    request.log.info(
        'Changes made to AVV_Catalogue Collection. Updating cache and deleting json file.'
    );

    const avvCatalogObject: AVVCatalogObject = request.object;
    const jsonFile = avvCatalogObject.get('catalogueFile');
    try {
        setLoggingContext(request.log);
        destroyFile(jsonFile);
    } catch (error) {
        getLogger().error(error.message);
        throw error;
    } finally {
        setLoggingContext(null);
    }

    setAVVCatalogCache.execute();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const afterDeleteAVVCatalogHook = (request: any) => {
    request.log.info(
        'Entry deleted from AVV_Catalogue Collection. Updating cache.'
    );

    setAVVCatalogCache.execute();
};

function destroyFile(file: Parse.File) {
    try {
        file.destroy({ useMasterKey: true });
    } catch (error) {
        getLogger().error(error.message);
    }
}
