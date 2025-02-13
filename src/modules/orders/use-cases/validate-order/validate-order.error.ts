import { UseCaseError } from '../../../shared/use-cases';

export class OrderValidationFailedError extends UseCaseError {}
export class UserInformationNotFoundError extends UseCaseError {}
