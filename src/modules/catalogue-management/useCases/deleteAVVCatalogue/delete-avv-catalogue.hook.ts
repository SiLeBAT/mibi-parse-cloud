import { ParseHookRequest } from '../../../shared/infrastructure';
import { AVVCatalogueObject } from '../../infrastructure/parse-types';

type DeleteAVVCatalogueRequest = ParseHookRequest<AVVCatalogueObject>;

export const deleteAVVCatalogueHook = async (
    request: DeleteAVVCatalogueRequest
) => {
    const avvCatalogueObject: AVVCatalogueObject = request.object;
    const file = avvCatalogueObject.get('catalogueFile');
    try {
        file.destroy({ useMasterKey: true });
    } catch (error) {
        request.log.error('Unable to delete file: ' + file.name());
    }
};
