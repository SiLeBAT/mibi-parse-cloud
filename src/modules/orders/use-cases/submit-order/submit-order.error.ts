import { AnalysisValidationFinding } from '../../legacy/application/analysis-validation.service';
import { UseCaseError } from '../../../shared/use-cases';

export class InvalidInputError extends UseCaseError {}
export class AutoCorrectedInputError extends UseCaseError {}
export class OrderSubmissionError extends UseCaseError {}

/**
 * The order is well formed but its analysis data cannot be submitted as sent -
 * see AnalysisValidationService. Carries the findings so the controller can
 * tell the sender what exactly is wrong instead of a generic failure.
 */
export class InvalidAnalysisError extends UseCaseError {
    constructor(
        message: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: any,
        readonly findings: AnalysisValidationFinding[]
    ) {
        super(message, error);
    }
}
