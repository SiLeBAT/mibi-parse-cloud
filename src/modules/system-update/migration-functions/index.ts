import { mp35CreateUserInfo } from './mp35-create-user-info';
import { mp35CreateAVVCatalogue } from './mp37-create-avv-catalogue';
import { mp38CreateAdditionalPathogens } from './mp38-create-additional-pathogens';
import { mp39CreateNRL } from './mp39-create-nrl';
import { mp40CreateAnalysisProcedure } from './mp40-create-analysis-procedure';
import { mp41CreateTemplateFile } from './mp41-create-template-file';
import { mp66UpdateUserInfo } from './mp66-update-user-info';
import { mp87CreateAllowedPLZ } from './mp87-create-allowed-plz';

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
    mp41CreateTemplateFile,
    mp40CreateAnalysisProcedure,
    mp38CreateAdditionalPathogens,
    mp39CreateNRL,
    mp66UpdateUserInfo,
    mp87CreateAllowedPLZ
];
