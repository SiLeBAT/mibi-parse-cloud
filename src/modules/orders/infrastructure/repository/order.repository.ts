import { EntityId } from '../../../shared/domain/valueObjects';
import {
    ObjectKeys,
    OrderAttributes,
    OrderObject,
    ResultObject,
    SampleAttributes,
    SampleObject
} from '../../../shared/infrastructure/parse-types';
import { AbstractRepository } from '../../../shared/infrastructure/repositories';
import { SamplePersistenceAttributes } from '../../mappers/sample-persistence.mapper';

export type SavedOrderIds = {
    orderId: EntityId;
    sampleIds: EntityId[];
};

// Upper bound for the "find everything to delete" queries. A single user's
// orders (and their samples/results) stay well below this; the limit only
// guards against Parse's default page size of 100 silently truncating a delete.
const MAX_DELETE_QUERY_LIMIT = 100000;

export class OrderRepository extends AbstractRepository<OrderObject> {
    async saveOrder(
        orderAttrs: OrderAttributes,
        sampleAttrsList: SamplePersistenceAttributes[]
    ): Promise<SavedOrderIds> {
        const OrderClass = Parse.Object.extend(ObjectKeys.Order);
        const SampleClass = Parse.Object.extend(ObjectKeys.Sample);

        const orderObject: OrderObject = new OrderClass(orderAttrs);
        await orderObject.save(null, { useMasterKey: true });

        const sampleObjects: SampleObject[] = sampleAttrsList.map(attrs => {
            const sampleAttrs: SampleAttributes = {
                ...attrs,
                order: orderObject
            };
            return new SampleClass(sampleAttrs);
        });

        try {
            await Parse.Object.saveAll(sampleObjects, { useMasterKey: true });
        } catch (saveError) {
            const persistedSamples = sampleObjects.filter(sample => sample.id);
            try {
                if (persistedSamples.length > 0) {
                    await Parse.Object.destroyAll(persistedSamples, {
                        useMasterKey: true
                    });
                }
                await orderObject.destroy({ useMasterKey: true });
            } catch (rollbackError) {
                console.error(
                    'OrderRepository.saveOrder rollback failed — orphan records may remain.',
                    {
                        orderId: orderObject.id,
                        persistedSampleIds: persistedSamples.map(
                            sample => sample.id
                        ),
                        rollbackError
                    }
                );
            }
            throw saveError;
        }

        if (!orderObject.id) {
            throw new Error(
                'OrderRepository.saveOrder: saved order has no id.'
            );
        }

        const sampleIds = sampleObjects.map(sample => {
            if (!sample.id) {
                throw new Error(
                    'OrderRepository.saveOrder: saved sample has no id.'
                );
            }
            return EntityId.create({ value: sample.id });
        });

        return {
            orderId: EntityId.create({ value: orderObject.id }),
            sampleIds
        };
    }

    async findById(orderId: EntityId): Promise<OrderObject | undefined> {
        const query = this.getQuery();
        query.equalTo('objectId', orderId.value);
        return query.first({ useMasterKey: true });
    }

    async findByUser(userId: EntityId): Promise<OrderObject[]> {
        const userPointer = new Parse.User();
        userPointer.id = userId.value;

        const query = this.getQuery();
        query.equalTo('user', userPointer);
        query.descending('createdAt');

        return query.find({ useMasterKey: true });
    }

    async deleteOrder(orderId: EntityId): Promise<void> {
        const OrderClass = Parse.Object.extend(ObjectKeys.Order);
        const orderPointer: OrderObject = new OrderClass();
        orderPointer.id = orderId.value;

        await this.destroyOrdersWithChildren([orderPointer]);
    }

    async deleteAllByUser(userId: EntityId): Promise<number> {
        const userPointer = new Parse.User();
        userPointer.id = userId.value;

        const orderQuery = this.getQuery();
        orderQuery.equalTo('user', userPointer);
        orderQuery.limit(MAX_DELETE_QUERY_LIMIT);
        const orders = await orderQuery.find({ useMasterKey: true });

        await this.destroyOrdersWithChildren(orders);

        return orders.length;
    }

    // Deletes the given orders together with every Sample pointing at them and
    // every Result pointing at those samples. Destroyed leaf-first (results,
    // then samples, then orders) so a failure never orphans a child whose
    // parent is already gone.
    private async destroyOrdersWithChildren(
        orders: OrderObject[]
    ): Promise<void> {
        if (orders.length === 0) {
            return;
        }

        const sampleQuery = new Parse.Query<SampleObject>(ObjectKeys.Sample);
        sampleQuery.containedIn('order', orders);
        sampleQuery.limit(MAX_DELETE_QUERY_LIMIT);
        const samples = await sampleQuery.find({ useMasterKey: true });

        if (samples.length > 0) {
            const resultQuery = new Parse.Query<ResultObject>(
                ObjectKeys.Result
            );
            resultQuery.containedIn('sample', samples);
            resultQuery.limit(MAX_DELETE_QUERY_LIMIT);
            const results = await resultQuery.find({ useMasterKey: true });

            if (results.length > 0) {
                await Parse.Object.destroyAll(results, { useMasterKey: true });
            }
            await Parse.Object.destroyAll(samples, { useMasterKey: true });
        }

        await Parse.Object.destroyAll(orders, { useMasterKey: true });
    }
}
