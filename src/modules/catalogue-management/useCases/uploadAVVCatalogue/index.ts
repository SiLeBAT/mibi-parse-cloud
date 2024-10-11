import { ObjectKeys } from '../../../shared/infrastructure/parse-types';
import { beforeAVVCatalogueSaveHook } from './before-avv-catalogue-save.hook';
import { afterAVVCatalogueSaveHook } from './after-avv-catalogue-save.hook';

Parse.Cloud.beforeSave(ObjectKeys.AVVCatalogue, beforeAVVCatalogueSaveHook);
Parse.Cloud.afterSave(ObjectKeys.AVVCatalogue, afterAVVCatalogueSaveHook);
