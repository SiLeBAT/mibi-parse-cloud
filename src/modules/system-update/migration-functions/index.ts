import { mp35CreateUserInfo } from './mp35-create-user-info';
import { mp39CreateNRL } from './mp39-create-nrl';

export interface UpdateFunc {
    (): Promise<boolean>;
}
/* +++++++ IMPORTANT +++++++
 * New functions to extend or alter the db schema should be added here, at the BOTTOM of the array.
 * DO NOT REMOVE OR ALTER THE EXISTING ARRAY ENTRIES.
 */
export const UPDATE_FUNCTION_ARRAY: UpdateFunc[] = [
    mp35CreateUserInfo,
    mp39CreateNRL
];
