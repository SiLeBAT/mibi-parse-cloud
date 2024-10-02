import { logger } from '../../../system/logging';
import { ObjectKeys } from '../infrastructure/parse-types';
import { checkSystemConfiguration } from './checkSystemConfiguration';
import './getSystemInformation';
import { afterSaveNRLHook, setNRLCache } from './setNRLCache';
logger.info('Parse Cloud: Checking System Configuration.');
checkSystemConfiguration.execute();
logger.info('Parse Cloud: Creating NRL cache.');
setNRLCache.execute();

Parse.Cloud.afterSave(ObjectKeys.NRL, afterSaveNRLHook);
