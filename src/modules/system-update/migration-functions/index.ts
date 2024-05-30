import { mp35CreateUserInfo } from './mp35-create-user-info';
import { mp35CreateAVVCatalogue } from './mp37-create-avv-catalogue';
import { mp41CreateTemplateFile } from './mp41-create-template-file';


export interface UpdateFunc {
    (): Promise<boolean>;
}
/* +++++++ IMPORTANT +++++++
 * New functions to extend or alter the db schema should be added here, at the BOTTOM of the array.
 * DO NOT REMOVE OR ALTER THE EXISTING ARRAY ENTRIES.
 */
export const UPDATE_FUNCTION_ARRAY: UpdateFunc[] = [
    mp35CreateUserInfo,
    mp35CreateAVVCatalogue,
    mp41CreateTemplateFile
];
