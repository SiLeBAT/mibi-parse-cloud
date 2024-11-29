import { logger } from '../../../../system/logging';
import { ObjectKeys } from '../../../shared/infrastructure/parse-types';
import { afterDeletePLZHook, afterSavePLZHook } from './set-plz-cache.hook';
import { setPLZCache } from './set-plz-cache.use-case';
logger.info('Parse Cloud: Creating PLZ cache.');
setPLZCache.execute();
Parse.Cloud.afterSave(ObjectKeys.AllowedPLZ, afterSavePLZHook);
Parse.Cloud.afterDelete(ObjectKeys.AllowedPLZ, afterDeletePLZHook);
