import {
    GetSamplesWithResultsRequestValidation,
    getSamplesWithResultsController
} from './get-samples-with-results.controller';
export { GetSamplesWithResultsUseCase } from './get-samples-with-results.use-case';
export const FUNCTION_KEY = 'getSamplesWithResults';
Parse.Cloud.define(
    FUNCTION_KEY,
    getSamplesWithResultsController,
    GetSamplesWithResultsRequestValidation
);
