import { ObjectKeys } from '../../infrastructure/parse-types';
import { deleteAVVCatalogueHook } from './delete-avv-catalogue.hook';

Parse.Cloud.afterDelete(ObjectKeys.AVVCatalogue, deleteAVVCatalogueHook);
