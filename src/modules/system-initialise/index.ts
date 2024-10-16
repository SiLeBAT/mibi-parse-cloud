/**
 * The system initialise module includes functions that:
 * - set the system up to function properly and check system is working as plannned
 */
import { logger } from '../../system/logging';
import { ObjectKeys } from '../shared/infrastructure/parse-types';
import {
    afterDeleteAVVCatalogueHook,
    afterDeleteNRLHook,
    afterDeletePLZHook,
    afterSaveAVVCatalogueHook,
    afterSaveNRLHook,
    afterSavePLZHook,
    checkCollectionsForContent,
    checkSystemConfiguration,
    setNRLCache,
    setPLZCache
} from './useCases';

logger.info('Parse Cloud: Checking System Configuration.');
checkSystemConfiguration.execute();
logger.info('Parse Cloud: Checking Collections for content.');
checkCollectionsForContent.execute();

logger.info('Parse Cloud: Creating NRL cache.');
setNRLCache.execute();
Parse.Cloud.afterSave(ObjectKeys.NRL, afterSaveNRLHook);
Parse.Cloud.afterDelete(ObjectKeys.NRL, afterDeleteNRLHook);

logger.info('Parse Cloud: Creating PLZ cache.');
setPLZCache.execute();
Parse.Cloud.afterSave(ObjectKeys.AllowedPLZ, afterSavePLZHook);
Parse.Cloud.afterDelete(ObjectKeys.AllowedPLZ, afterDeletePLZHook);

logger.info('Parse Cloud: Setting AVVCatalogue hooks.');
// AVVCatalogue Cache is created at src/modules/orders/legacy/index.ts
Parse.Cloud.afterSave(ObjectKeys.AVVCatalogue, afterSaveAVVCatalogueHook);
Parse.Cloud.afterDelete(ObjectKeys.AVVCatalogue, afterDeleteAVVCatalogueHook);

logger.info('Parse Cloud: System initialise module loaded.');
