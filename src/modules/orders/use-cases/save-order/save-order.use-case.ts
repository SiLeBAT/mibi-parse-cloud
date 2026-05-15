import { EntityId } from '../../../shared/domain/valueObjects';
import { UseCase } from '../../../shared/use-cases';
import { OrderDTO } from '../../dto';
import {
    orderRepository,
    OrderRepository
} from '../../infrastructure/repository';
import { OrderPersistenceMapper, SamplePersistenceMapper } from '../../mappers';
import { OrderSavingError } from './save-order.error';

type SaveOrderInput = {
    order: OrderDTO;
    userId: EntityId;
};

export class SaveOrderUseCase
    implements UseCase<SaveOrderInput, Promise<OrderDTO>>
{
    constructor(private orderRepo: OrderRepository) {}

    async execute({ order, userId }: SaveOrderInput): Promise<OrderDTO> {
        const samples = order.sampleSet.samples;

        const pathogens = [
            ...new Set(
                samples
                    .map(sample => sample.sampleData.pathogen_avv.value)
                    .filter((avvValue): avvValue is string => Boolean(avvValue))
            )
        ];

        const nrls = [
            ...new Set(
                samples
                    .map(sample => sample.sampleMeta.nrl)
                    .filter((nrlValue): nrlValue is string => Boolean(nrlValue))
            )
        ];

        const results = `0/${samples.length}`;

        const orderAttrs = OrderPersistenceMapper.toPersistence(order, userId, {
            pathogens,
            nrls,
            sampleCount: samples.length,
            results
        });
        const sampleAttrsList = samples.map((sample, index) =>
            SamplePersistenceMapper.toPersistence(sample, index + 1)
        );

        try {
            const { orderId, sampleIds } = await this.orderRepo.saveOrder(
                orderAttrs,
                sampleAttrsList
            );
            return {
                ...order,
                objectId: orderId.value,
                sampleSet: {
                    ...order.sampleSet,
                    samples: samples.map((sample, index) => ({
                        ...sample,
                        objectId: sampleIds[index].value
                    }))
                }
            };
        } catch (error) {
            throw new OrderSavingError(
                'Failed to save order and samples to the database.',
                error
            );
        }
    }

    async rollback(savedOrder: OrderDTO): Promise<void> {
        if (!savedOrder.objectId) return;
        await this.orderRepo.deleteOrder(
            EntityId.create({ value: savedOrder.objectId })
        );
    }
}

const saveOrder = new SaveOrderUseCase(orderRepository);

export { saveOrder };
