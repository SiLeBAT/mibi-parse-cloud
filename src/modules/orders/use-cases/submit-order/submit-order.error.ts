import { UseCaseError } from '../../../shared/use-cases';

export class InvalidInputError extends UseCaseError {}
export class AutoCorrectedInputError extends UseCaseError {}
