import {
    CreateSubmissionFileRequestValidation,
    createSubmissionFileController
} from './create-submission-file.controller';

export const FUNCTION_KEY = 'marshallSampleData';
Parse.Cloud.define(
    FUNCTION_KEY,
    createSubmissionFileController,
    CreateSubmissionFileRequestValidation
);
