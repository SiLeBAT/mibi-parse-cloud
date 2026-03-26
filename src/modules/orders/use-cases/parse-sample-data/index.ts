import {
    ParseSampleDataRequestValidation,
    parseSampleDataController
} from './parse-sample-data.controller';
export { ParseSampleDataUseCase } from './parse-sample-data.use-case';
export const FUNCTION_KEY = 'parseSampleData';
Parse.Cloud.define(
    FUNCTION_KEY,
    parseSampleDataController,
    ParseSampleDataRequestValidation
);
