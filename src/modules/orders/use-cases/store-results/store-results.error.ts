import { UseCaseError } from '../../../shared/use-cases';

export class StoreResultsError extends UseCaseError {}

/** The payload is malformed: not an array, or an element has the wrong shape. */
export class InvalidResultPayloadError extends UseCaseError {}

/**
 * At least one referenced sample objectId does not exist. The import is
 * all-or-nothing, so nothing has been written when this is thrown.
 */
export class UnknownSamplesError extends UseCaseError {}
