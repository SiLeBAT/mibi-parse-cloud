import { ObjectKeys } from '../../../shared/infrastructure/parse-types';
import { beforeZomoPlanFileSaveHook } from './before-zomo-plan-file-save.hook';

Parse.Cloud.beforeSave(ObjectKeys.ZomoPlanFile, beforeZomoPlanFileSaveHook);
