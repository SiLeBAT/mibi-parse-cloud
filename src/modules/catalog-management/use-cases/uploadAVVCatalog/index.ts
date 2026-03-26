import { ObjectKeys } from '../../../shared/infrastructure/parse-types';
import { beforeAVVCatalogSaveHook } from './before-avv-catalog-save.hook';

Parse.Cloud.beforeSave(ObjectKeys.AVVCatalog, beforeAVVCatalogSaveHook);
