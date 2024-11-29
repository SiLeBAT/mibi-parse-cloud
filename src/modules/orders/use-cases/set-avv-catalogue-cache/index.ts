import { logger } from '../../../../system/logging';
import { ObjectKeys } from '../../../shared/infrastructure/parse-types';
import {
    afterDeleteAVVCatalogueHook,
    afterSaveAVVCatalogueHook
} from './set-avvcatalogue-cache.hook';
export { setAVVCatalogueCache } from './set-avvcatalogue-cache.use-case';

logger.info('Parse Cloud: Setting AVVCatalogue hooks.');
// AVVCatalogue Cache is created at src/modules/orders/legacy/index.ts
Parse.Cloud.afterSave(ObjectKeys.AVVCatalogue, afterSaveAVVCatalogueHook);
Parse.Cloud.afterDelete(ObjectKeys.AVVCatalogue, afterDeleteAVVCatalogueHook);
