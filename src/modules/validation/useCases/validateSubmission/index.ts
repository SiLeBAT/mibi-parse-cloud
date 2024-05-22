import {
    ValidateSubmissionRequestValidation,
    validateSubmissionController
} from './validate-submission.controller';

export const FUNCTION_KEY = 'validateSampleData';
Parse.Cloud.define(
    FUNCTION_KEY,
    validateSubmissionController,
    ValidateSubmissionRequestValidation
);
