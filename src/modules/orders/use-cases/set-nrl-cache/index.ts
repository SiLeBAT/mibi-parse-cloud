import { logger } from '../../../../system/logging';
import { ObjectKeys } from '../../../shared/infrastructure/parse-types';
import { afterDeleteNRLHook, afterSaveNRLHook } from './set-nrl-cache.hook';
import { setNRLCache } from './set-nrl-cache.use-case';

logger.info('Parse Cloud: Creating NRL cache.');
setNRLCache.execute();
Parse.Cloud.afterSave(ObjectKeys.NRL, afterSaveNRLHook);
Parse.Cloud.afterDelete(ObjectKeys.NRL, afterDeleteNRLHook);
