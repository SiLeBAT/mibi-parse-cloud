import { UseCaseError } from '../../../shared/useCases';

export class InvalidInputError extends UseCaseError {}
export class AutoCorrectedInputError extends UseCaseError {}
