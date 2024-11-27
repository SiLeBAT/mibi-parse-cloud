import { logger } from '../../system/logging';
import { afterDeleteUserHook } from './use-cases';
logger.info('Parse Cloud: User Management module loaded.');

Parse.Cloud.afterDelete(Parse.User, afterDeleteUserHook);
