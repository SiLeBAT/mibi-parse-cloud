import { storeResultsController } from './store-results.controller';
export { StoreResultsUseCase } from './store-results.use-case';
export const FUNCTION_KEY = 'storeResults';
Parse.Cloud.define(FUNCTION_KEY, storeResultsController);
