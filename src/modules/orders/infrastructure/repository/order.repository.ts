import { EntityId } from '../../../shared/domain/valueObjects';
import {
    ObjectKeys,
    OrderAttributes,
    OrderObject,
    SampleAttributes,
    SampleObject
} from '../../../shared/infrastructure/parse-types';
import { AbstractRepository } from '../../../shared/infrastructure/repositories';
import { SamplePersistenceAttributes } from '../../mappers/sample-persistence.mapper';

export type SavedOrderIds = {
    orderId: EntityId;
    sampleIds: EntityId[];
};

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

        const sampleQuery = new Parse.Query<SampleObject>(ObjectKeys.Sample);
        sampleQuery.equalTo('order', orderPointer);
        const samples = await sampleQuery.find({ useMasterKey: true });
        if (samples.length > 0) {
            await Parse.Object.destroyAll(samples, { useMasterKey: true });
        }
        await orderPointer.destroy({ useMasterKey: true });
    }
}
