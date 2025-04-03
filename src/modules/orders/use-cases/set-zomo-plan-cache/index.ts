import { logger } from '../../../../system/logging';
import { ObjectKeys } from '../../../shared/infrastructure/parse-types';
import {
    afterDeleteZomoPlanHook,
    afterSaveZomoPlanHook
} from './set-zomo-plan-cache.hook';
export { setZomoPlanCache } from './set-zomo-plan-cache.use-case';

logger.info('Parse Cloud: Setting Zomo Plan hooks.');
Parse.Cloud.afterSave(ObjectKeys.ZomoPlan, afterSaveZomoPlanHook);
Parse.Cloud.afterDelete(ObjectKeys.ZomoPlan, afterDeleteZomoPlanHook);
