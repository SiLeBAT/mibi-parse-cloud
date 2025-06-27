import { ObjectKeys } from '../../../shared/infrastructure/parse-types';
import { beforeInstituteSaveHook } from './before-institute-save.hook';

Parse.Cloud.beforeSave(ObjectKeys.Institute, beforeInstituteSaveHook);
