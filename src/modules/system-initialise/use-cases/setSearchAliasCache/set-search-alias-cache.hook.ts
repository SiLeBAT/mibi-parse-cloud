import { setSearchAliasCache } from './set-search-alias-cache.use-case';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const afterSaveSearchAliasHook = (request: any) => {
    request.log.info(
        'Changes made to Search_Alias Collection. Updating cache.'
    );
    setSearchAliasCache.execute();
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const afterDeleteSearchAliasHook = (request: any) => {
    request.log.info(
        'Entry deleted from Search_Alias Collection. Updating cache.'
    );
    setSearchAliasCache.execute();
};
