/* eslint-disable @typescript-eslint/no-namespace */
import { UseCaseError } from '../../../shared/useCases';

export class RequestDataValidationFailedError extends UseCaseError {}
export class RequestHeaderValidationFailedError extends UseCaseError {}
