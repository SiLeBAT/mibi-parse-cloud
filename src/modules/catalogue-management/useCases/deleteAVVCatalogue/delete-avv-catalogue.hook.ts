import {
    getLogger,
    setLoggingContext
} from '../../../shared/core/logging-context';
import { ParseHookRequest } from '../../../shared/infrastructure';
import { AVVCatalogueObject } from '../../../shared/infrastructure/parse-types';

type DeleteAVVCatalogueRequest = ParseHookRequest<
    AVVCatalogueObject,
    undefined
>;

export const deleteAVVCatalogueHook = async (
    request: DeleteAVVCatalogueRequest
) => {
    const avvCatalogueObject: AVVCatalogueObject = request.object;
    setLoggingContext(request.log);
    try {
        const file = avvCatalogueObject.get('catalogueFile');
        file.destroy({ useMasterKey: true });
    } catch (error) {
        getLogger().error(error.message);
    } finally {
        setLoggingContext(null);
    }
};
