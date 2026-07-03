import { EntityId } from '../../../shared/domain/valueObjects';
import { UseCase } from '../../../shared/use-cases';
import { OrderDTO } from '../../dto';
import {
    orderRepository,
    OrderRepository,
    userRepository,
    UserRepository
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
    constructor(
        private orderRepo: OrderRepository,
        private userRepo: UserRepository
    ) {}

    async execute({ order, userId }: SaveOrderInput): Promise<OrderDTO> {
        // The order is only persisted when the user has granted data-save
        // consent. Without consent the order is returned unchanged (no
        // objectId), so the caller knows it was not stored.
        const consentGiven = await this.userRepo.isDataSaveAgreed(userId);
        if (!consentGiven) {
            return order;
        }

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

        const sampleIds = [
            ...new Set(
                samples
                    .map(sample => sample.sampleData.sample_id.value)
                    .filter((sampleIdValue): sampleIdValue is string =>
                        Boolean(sampleIdValue)
                    )
            )
        ];

        const sampleIdsAVV = [
            ...new Set(
                samples
                    .map(sample => sample.sampleData.sample_id_avv.value)
                    .filter((sampleIdAVVValue): sampleIdAVVValue is string =>
                        Boolean(sampleIdAVVValue)
                    )
            )
        ];

        const results = `0/${samples.length}`;

        const orderAttrs = OrderPersistenceMapper.toPersistence(order, userId, {
            pathogens,
            nrls,
            sampleIds,
            sampleIdsAVV,
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

const saveOrder = new SaveOrderUseCase(orderRepository, userRepository);

export { saveOrder };
