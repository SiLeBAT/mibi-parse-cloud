import { mp26CheckUserInfoLink } from './mp26-check-user-info-link';

export interface IntegrityFunc {
    (): Promise<boolean>;
}
/* +++++++ IMPORTANT +++++++
 * New functions to check the data integrity should be added here.  Order is not important.
 */
export const CHECK_FUNCTION_ARRAY: IntegrityFunc[] = [mp26CheckUserInfoLink];
