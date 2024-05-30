import { mp35CreateUserInfo } from './mp35-create-user-info';
import { mp40CreateAnalysisProcedure } from './mp40-create-analysis-procedure';

export interface UpdateFunc {
    (): Promise<boolean>;
}
/* +++++++ IMPORTANT +++++++
 * New functions to extend or alter the db schema should be added here, at the BOTTOM of the array.
 * DO NOT REMOVE OR ALTER THE EXISTING ARRAY ENTRIES.
 */
export const UPDATE_FUNCTION_ARRAY: UpdateFunc[] = [
    mp35CreateUserInfo,
    mp40CreateAnalysisProcedure
];
