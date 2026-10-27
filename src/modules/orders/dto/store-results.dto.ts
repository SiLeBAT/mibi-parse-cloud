import { ResultDataDTO } from './samples-with-results.dto';

/**
 * One element of the import payload: a single property whose name is the Parse
 * objectId of the sample, and whose value is that result's data.
 */
export type StoreResultsEntryDTO = Record<string, ResultDataDTO>;

/**
 * The import payload: an array rather than an object keyed by sample objectId,
 * because a sample may have more than one result and a JSON object cannot hold
 * the same key twice — duplicate keys are silently dropped when the payload is
 * parsed, losing one of the results before it ever reaches this code.
 */
export type StoreResultsPayloadDTO = StoreResultsEntryDTO[];

/** One Result row created by an import. */
export interface StoredResultDTO {
    objectId: string;
    sampleObjectId: string;
    position: number;
}

/** Recalculated counter of an order touched by an import. */
export interface StoredResultsOrderDTO {
    orderId: string;
    results: string;
}

export interface StoreResultsCollectionDTO {
    storedResultCount: number;
    orders: StoredResultsOrderDTO[];
    created: StoredResultDTO[];
}
