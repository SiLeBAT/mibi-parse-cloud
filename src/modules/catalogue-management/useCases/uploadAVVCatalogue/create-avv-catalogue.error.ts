import { UseCaseError } from '../../../shared/useCases';

export class XMLValidationFailedError extends UseCaseError {}
export class UnsupportedFileTypeError extends UseCaseError {}
export class CatalogueDuplicationError extends UseCaseError {}
