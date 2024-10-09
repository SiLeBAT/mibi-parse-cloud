import { ObjectKeys } from '../../../shared/infrastructure/parse-types';
import { deleteAVVCatalogueHook } from './delete-avv-catalogue.hook';

Parse.Cloud.afterDelete(ObjectKeys.AVVCatalogue, deleteAVVCatalogueHook);
