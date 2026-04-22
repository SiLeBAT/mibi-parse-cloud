import { UseCaseError } from '../../../shared/use-cases';

export class SubmissionCreationFailedError extends UseCaseError {}
export class ExcelVersionError extends UseCaseError {
    currentVersions: string[];
    constructor(message: string, currentVersions: string[], error: Error) {
        super(message, error);
        this.currentVersions = currentVersions;
    }
}
