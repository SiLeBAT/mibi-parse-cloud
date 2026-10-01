import {
    ObjectKeys,
    ResultObject,
    SampleObject
} from '../../../shared/infrastructure/parse-types';
import { AbstractRepository } from '../../../shared/infrastructure/repositories';

/** A Result row about to be created. */
export type NewResult = {
    sample: SampleObject;
    position: number;
    resultData: string;
};

// Upper bound for the result queries. Without an explicit limit Parse falls
// back to its default page size of 100, which would silently hide existing
// results and restart the position numbering part-way through an order.
const MAX_RESULT_QUERY_LIMIT = 100000;

export class ResultRepository extends AbstractRepository<ResultObject> {
    /**
     * Highest position already taken per sample, so an import can continue the
     * numbering instead of repeating it. Samples with no results yet are absent
     * from the map.
     */
    async findMaxPositionsBySample(
        samples: SampleObject[]
    ): Promise<Map<string, number>> {
        const maxPositions = new Map<string, number>();
        if (samples.length === 0) {
            return maxPositions;
        }

        const query = this.getQuery();
        query.containedIn('sample', samples);
        query.limit(MAX_RESULT_QUERY_LIMIT);
        const results = await query.find({ useMasterKey: true });

        for (const result of results) {
            const sampleId = result.get('sample')?.id;
            if (!sampleId) {
                continue;
            }
            const position = result.get('position') ?? 0;
            const known = maxPositions.get(sampleId) ?? 0;
            if (position > known) {
                maxPositions.set(sampleId, position);
            }
        }

        return maxPositions;
    }

    /**
     * Creates the given Result rows. Writes with the master key because the
     * Result class permits create/update/delete to nobody else (see the
     * mp228-create-result migration).
     *
     * On failure any row that did reach the database is destroyed again, so a
     * partially applied import cannot leave the order half-populated.
     */
    async saveResults(newResults: NewResult[]): Promise<ResultObject[]> {
        if (newResults.length === 0) {
            return [];
        }

        const ResultClass = Parse.Object.extend(ObjectKeys.Result);
        const resultObjects: ResultObject[] = newResults.map(
            newResult =>
                new ResultClass({
                    sample: newResult.sample,
                    position: newResult.position,
                    resultData: newResult.resultData
                })
        );

        try {
            await Parse.Object.saveAll(resultObjects, { useMasterKey: true });
        } catch (saveError) {
            const persisted = resultObjects.filter(result => result.id);
            try {
                if (persisted.length > 0) {
                    await Parse.Object.destroyAll(persisted, {
                        useMasterKey: true
                    });
                }
            } catch (rollbackError) {
                console.error(
                    'ResultRepository.saveResults rollback failed — orphan results may remain.',
                    {
                        persistedResultIds: persisted.map(result => result.id),
                        rollbackError
                    }
                );
            }
            throw saveError;
        }

        return resultObjects;
    }

    /** How many of the given samples carry at least one result. */
    async countSamplesWithResults(samples: SampleObject[]): Promise<number> {
        if (samples.length === 0) {
            return 0;
        }

        const query = this.getQuery();
        query.containedIn('sample', samples);
        query.limit(MAX_RESULT_QUERY_LIMIT);
        const results = await query.find({ useMasterKey: true });

        const coveredSampleIds = new Set<string>();
        for (const result of results) {
            const sampleId = result.get('sample')?.id;
            if (sampleId) {
                coveredSampleIds.add(sampleId);
            }
        }

        return coveredSampleIds.size;
    }
}
