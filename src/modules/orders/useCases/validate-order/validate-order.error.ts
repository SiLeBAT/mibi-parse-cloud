import { UseCaseError } from '../../../shared/useCases';

export class OrderValidationFailedError extends UseCaseError {}
export class UserInformationNotFoundError extends UseCaseError {}
