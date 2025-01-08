import { logger } from '../../../../system/logging';
import { ObjectKeys } from '../../../shared/infrastructure/parse-types';
import {
    afterDeleteAVVCatalogHook,
    afterSaveAVVCatalogHook
} from './set-avvcatalog-cache.hook';
export { setAVVCatalogCache } from './set-avvcatalog-cache.use-case';

logger.info('Parse Cloud: Setting AVVCatalog hooks.');
// AVVCatalog Cache is created at src/modules/orders/legacy/index.ts
Parse.Cloud.afterSave(ObjectKeys.AVVCatalog, afterSaveAVVCatalogHook);
Parse.Cloud.afterDelete(ObjectKeys.AVVCatalog, afterDeleteAVVCatalogHook);
