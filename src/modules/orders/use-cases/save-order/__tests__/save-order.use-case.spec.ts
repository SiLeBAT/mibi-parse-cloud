import { EntityId } from '../../../../shared/domain/valueObjects';
import { OrderDTO } from '../../../dto';
import {
    OrderPersistenceMapper,
    SamplePersistenceMapper
} from '../../../mappers';
import { SaveOrderUseCase } from '../save-order.use-case';

const USER_ID = EntityId.create({ value: 'user-1' });

// Minimal order DTO: only the fields the use case reads
// (pathogen_avv.value and sampleMeta.nrl).
const orderDTO = (): OrderDTO =>
    ({
        sampleSet: {
            samples: [
                {
                    sampleData: { pathogen_avv: { value: 'avv-1' } },
                    sampleMeta: { nrl: 'NRL-AR' }
                }
            ],
            meta: {}
        }
    } as unknown as OrderDTO);

const makeUseCase = (consentGranted: boolean) => {
    const userRepo = {
        isDataSaveAgreed: jest.fn().mockResolvedValue(consentGranted)
    };
    const orderRepo = {
        saveOrder: jest.fn().mockResolvedValue({
            orderId: EntityId.create({ value: 'order-1' }),
            sampleIds: [EntityId.create({ value: 'sample-1' })]
        }),
        deleteOrder: jest.fn().mockResolvedValue(undefined)
    };
    const useCase = new SaveOrderUseCase(orderRepo as never, userRepo as never);
    return { useCase, userRepo, orderRepo };
};

describe('SaveOrderUseCase', () => {
    afterEach(() => jest.restoreAllMocks());

    it('does not persist the order when the user has not granted data-save consent', async () => {
        const { useCase, userRepo, orderRepo } = makeUseCase(false);
        const order = orderDTO();

        const result = await useCase.execute({ order, userId: USER_ID });

        expect(userRepo.isDataSaveAgreed).toHaveBeenCalledWith(USER_ID);
        expect(orderRepo.saveOrder).not.toHaveBeenCalled();
        // Returned unchanged (no objectId) so the controller still submits it to
        // the BfR without storing it in the MiBi-Portal.
        expect(result).toBe(order);
        expect(result.objectId).toBeUndefined();
    });

    it('persists the order and returns the saved ids when consent is granted', async () => {
        jest.spyOn(OrderPersistenceMapper, 'toPersistence').mockReturnValue(
            {} as never
        );
        jest.spyOn(SamplePersistenceMapper, 'toPersistence').mockReturnValue(
            {} as never
        );
        const { useCase, orderRepo } = makeUseCase(true);
        const order = orderDTO();

        const result = await useCase.execute({ order, userId: USER_ID });

        expect(orderRepo.saveOrder).toHaveBeenCalledTimes(1);
        expect(result.objectId).toBe('order-1');
        expect(result.sampleSet.samples[0].objectId).toBe('sample-1');
    });
});
