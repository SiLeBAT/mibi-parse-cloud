import { UseCaseError } from '../../../shared/use-cases';

export class XMLValidationFailedError extends UseCaseError {}
export class UnsupportedFileTypeError extends UseCaseError {}
export class CatalogDuplicationError extends UseCaseError {}
