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

export class SampleRepository extends AbstractRepository<SampleObject> {
    async findByOrderWithResults(
        orderId: EntityId
    ): Promise<SampleWithResults[]> {
        const OrderClass = Parse.Object.extend(ObjectKeys.Order);
        const orderPointer: OrderObject = new OrderClass();
        orderPointer.id = orderId.value;

        const sampleQuery = this.getQuery();
        sampleQuery.equalTo('order', orderPointer);
        sampleQuery.ascending('position');
        const samples = await sampleQuery.find({ useMasterKey: true });

        if (samples.length === 0) {
            return [];
        }

        const resultQuery = new Parse.Query<ResultObject>(ObjectKeys.Result);
        resultQuery.containedIn('sample', samples);
        resultQuery.ascending('position');
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
