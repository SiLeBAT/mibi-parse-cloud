import { setAVVCatalogueCache } from './set-avvcatalogue-cache.use-case';
import {
    getLogger,
    setLoggingContext
} from '../../../shared/core/logging-context';
import { ParseHookRequest } from '../../../shared/infrastructure';
import { AVVCatalogueObject } from '../../../shared/infrastructure/parse-types';
type AVVCatalogueSaveContext = Record<string, unknown>;
type AfterAVVCatalogueSaveHookRequest = ParseHookRequest<
    AVVCatalogueObject,
    AVVCatalogueSaveContext
>;

export const afterSaveAVVCatalogueHook = async (
    request: AfterAVVCatalogueSaveHookRequest
) => {
    request.log.info(
        'Changes made to AVV_Catalogue Collection. Updating cache and deleting json file.'
    );

    const avvCatalogueObject: AVVCatalogueObject = request.object;
    const jsonFile = avvCatalogueObject.get('catalogueFile');
    try {
        setLoggingContext(request.log);
        destroyFile(jsonFile);
    } catch (error) {
        getLogger().error(error.message);
        throw error;
    } finally {
        setLoggingContext(null);
    }

    setAVVCatalogueCache.execute();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const afterDeleteAVVCatalogueHook = (request: any) => {
    request.log.info(
        'Entry deleted from AVV_Catalogue Collection. Updating cache.'
    );

    setAVVCatalogueCache.execute();
};

function destroyFile(file: Parse.File) {
    try {
        file.destroy({ useMasterKey: true });
    } catch (error) {
        getLogger().error(error.message);
    }
}
