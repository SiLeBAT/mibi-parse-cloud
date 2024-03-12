import {
    CreateSubmissionRequestValidation,
    createSubmissionController
} from './create-submission.controller';

export const FUNCTION_KEY = 'putSampleData';
Parse.Cloud.define(
    FUNCTION_KEY,
    createSubmissionController,
    CreateSubmissionRequestValidation
);
