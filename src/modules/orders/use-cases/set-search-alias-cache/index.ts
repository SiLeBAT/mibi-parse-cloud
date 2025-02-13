import { logger } from '../../../../system/logging';
import { ObjectKeys } from '../../../shared/infrastructure/parse-types';
import {
    afterDeleteSearchAliasHook,
    afterSaveSearchAliasHook
} from './set-search-alias-cache.hook';
export { setSearchAliasCache } from './set-search-alias-cache.use-case';

logger.info('Parse Cloud: Creating Search-Alias hooks.');
// Search-Alias Cache is created at src/modules/orders/legacy/index.ts
Parse.Cloud.afterSave(ObjectKeys.SearchAlias, afterSaveSearchAliasHook);
Parse.Cloud.afterDelete(ObjectKeys.SearchAlias, afterDeleteSearchAliasHook);
