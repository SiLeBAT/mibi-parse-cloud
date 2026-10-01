import { EntityId } from '../../../shared/domain/valueObjects';
import {
    ObjectKeys,
    OrderObject,
    ResultObject,
    SampleObject
} from '../../../shared/infrastructure/parse-types';
import { AbstractRepository } from '../../../shared/infrastructure/repositories';

export type SampleWithResults = {
    sample: SampleObject;
    results: ResultObject[];
};

// Upper bound for the results-view queries. Without an explicit limit Parse
// falls back to its default page size of 100, which silently truncated orders
// of more than 100 samples. An order holds at most a few hundred samples, and
// each sample a handful of results, so both stay well below this bound.
const MAX_RESULTS_VIEW_QUERY_LIMIT = 100000;

export class SampleRepository extends AbstractRepository<SampleObject> {
    /** Every sample of an order, in upload order. */
    async findByOrder(orderId: EntityId): Promise<SampleObject[]> {
        const OrderClass = Parse.Object.extend(ObjectKeys.Order);
        const orderPointer: OrderObject = new OrderClass();
        orderPointer.id = orderId.value;

        const sampleQuery = this.getQuery();
        sampleQuery.equalTo('order', orderPointer);
        sampleQuery.ascending('position');
        sampleQuery.limit(MAX_RESULTS_VIEW_QUERY_LIMIT);
        return sampleQuery.find({ useMasterKey: true });
    }

    /**
     * Resolves sample objectIds supplied by a caller. Ids that do not exist are
     * simply absent from the returned array, which is what lets an import
     * report them all at once and write nothing.
     */
    async findByIds(sampleIds: string[]): Promise<SampleObject[]> {
        if (sampleIds.length === 0) {
            return [];
        }

        const sampleQuery = this.getQuery();
        sampleQuery.containedIn('objectId', sampleIds);
        sampleQuery.limit(MAX_RESULTS_VIEW_QUERY_LIMIT);
        return sampleQuery.find({ useMasterKey: true });
    }

    async findByOrderWithResults(
        orderId: EntityId
    ): Promise<SampleWithResults[]> {
        const samples = await this.findByOrder(orderId);

        if (samples.length === 0) {
            return [];
        }

        const resultQuery = new Parse.Query<ResultObject>(ObjectKeys.Result);
        resultQuery.containedIn('sample', samples);
        resultQuery.ascending('position');
        resultQuery.limit(MAX_RESULTS_VIEW_QUERY_LIMIT);
        const results = await resultQuery.find({ useMasterKey: true });

        const resultsBySampleId = new Map<string, ResultObject[]>();
        for (const result of results) {
            const sampleId = result.get('sample')?.id;
            if (!sampleId) {
                continue;
            }
            const existing = resultsBySampleId.get(sampleId) ?? [];
            existing.push(result);
            resultsBySampleId.set(sampleId, existing);
        }

        return samples.map(sample => ({
            sample,
            results: sample.id ? resultsBySampleId.get(sample.id) ?? [] : []
        }));
    }
}
