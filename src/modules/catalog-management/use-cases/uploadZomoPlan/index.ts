import { ObjectKeys } from '../../../shared/infrastructure/parse-types';
import { beforeZomoPlanSaveHook } from './before-zomo-plan-save.hook';

Parse.Cloud.beforeSave(ObjectKeys.ZomoPlan, beforeZomoPlanSaveHook);
