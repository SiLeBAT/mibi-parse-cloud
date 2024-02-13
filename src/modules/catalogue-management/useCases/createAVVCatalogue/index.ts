import { ObjectKeys } from '../../infrastructure/parse-types';
import { createAVVCatalogueHook } from './create-avv-catalogue.hook';

Parse.Cloud.beforeSave(ObjectKeys.AVVCatalogue, createAVVCatalogueHook);
