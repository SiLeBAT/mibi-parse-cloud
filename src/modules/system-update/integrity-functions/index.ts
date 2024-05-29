import { mp26CreateUserInfoLink } from './mp26-check-user-info-link';

export interface IntegrityFunc {
    (): Promise<boolean>;
}
/* +++++++ IMPORTANT +++++++
 * New functions to extend or alter the db schema should be added here, at the BOTTOM of the array.
 * DO NOT REMOVE OR ALTER THE EXISTING ARRAY ENTRIES.
 */
export const CHECK_FUNCTION_ARRAY: IntegrityFunc[] = [mp26CreateUserInfoLink];
