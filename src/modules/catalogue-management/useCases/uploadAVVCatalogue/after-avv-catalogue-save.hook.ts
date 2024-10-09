import {
    getLogger,
    setLoggingContext
} from '../../../shared/core/logging-context';
import { ParseHookRequest } from '../../../shared/infrastructure';
import { AVVCatalogueObject } from '../../infrastructure/parse-types';
type AVVCatalogueSaveContext = Record<string, unknown>;
type AfterAVVCatalogueSaveHookRequest = ParseHookRequest<
    AVVCatalogueObject,
    AVVCatalogueSaveContext
>;
export const afterAVVCatalogueSaveHook = async (
    request: AfterAVVCatalogueSaveHookRequest
) => {
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
};
function destroyFile(file: Parse.File) {
    try {
        file.destroy({ useMasterKey: true });
    } catch (error) {
        getLogger().error(error.message);
    }
}
