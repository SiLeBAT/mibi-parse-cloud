import { UseCaseError } from '../../../shared/use-cases';

export class GetSamplesWithResultsError extends UseCaseError {}

export class OrderNotFoundError extends UseCaseError {}

export class OrderAccessForbiddenError extends UseCaseError {}
