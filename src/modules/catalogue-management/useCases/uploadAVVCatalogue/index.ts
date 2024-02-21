import { ObjectKeys } from '../../infrastructure/parse-types';
import { beforeAVVCatalogueSaveHook } from './before-avv-catalogue-save.hook';

Parse.Cloud.beforeSave(ObjectKeys.AVVCatalogue, beforeAVVCatalogueSaveHook);
