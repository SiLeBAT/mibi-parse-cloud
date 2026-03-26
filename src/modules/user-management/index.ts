import { logger } from '../../system/logging';
import {
    afterDeleteUserHook,
    afterSaveUserHook,
    beforeSaveUserHook
} from './use-cases';
logger.info('Parse Cloud: User Management module loaded.');

Parse.Cloud.afterDelete(Parse.User, afterDeleteUserHook);
Parse.Cloud.beforeSave(Parse.User, beforeSaveUserHook);
Parse.Cloud.afterSave(Parse.User, afterSaveUserHook);
