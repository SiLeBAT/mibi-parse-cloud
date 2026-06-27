import { EntityId } from '../../../../shared/domain/valueObjects';
import { GetSamplesWithResultsUseCase } from '../get-samples-with-results.use-case';
import {
    OrderAccessForbiddenError,
    OrderNotFoundError
} from '../get-samples-with-results.error';

const OWNER_ID = 'owner1';
const ORDER_ID = 'order1';
const USER_EMAIL = 'owner@example.com';

// Minimal Parse.Object stand-ins: only id + get(key) are used by the use-case.
const fakeObject = (id: string, fields: Record<string, unknown>) => ({
    id,
    get: (key: string) => fields[key]
});

const fakeOrder = (ownerId: string | undefined) => ({
    get: (key: string) => (key === 'user' ? { id: ownerId } : undefined)
});

const makeUseCase = (overrides: {
    order?: unknown;
    samplesWithResults?: unknown;
    ownerId?: string;
}) => {
    const userRepo = {
        getIdForEmail: jest
            .fn()
            .mockResolvedValue(
                EntityId.create({ value: overrides.ownerId ?? OWNER_ID })
            )
    };
    const orderRepo = {
        findById: jest
            .fn()
            .mockResolvedValue(
                'order' in overrides ? overrides.order : fakeOrder(OWNER_ID)
            )
    };
    const sampleRepo = {
        findByOrderWithResults: jest
            .fn()
            .mockResolvedValue(overrides.samplesWithResults ?? [])
    };
    const useCase = new GetSamplesWithResultsUseCase(
        orderRepo as never,
        sampleRepo as never,
        userRepo as never
    );
    return { useCase, userRepo, orderRepo, sampleRepo };
};

describe('GetSamplesWithResultsUseCase', () => {
    it('maps samples and parses sampleData/sampleMeta/resultData into objects', async () => {
        const { useCase } = makeUseCase({
            samplesWithResults: [
                {
                    sample: fakeObject('s1', {
                        position: 1,
                        sampleData: JSON.stringify({
                            sample_id: { value: '1' }
                        }),
                        sampleMeta: JSON.stringify({ nrl: 'NRL-AR' })
                    }),
                    results: [
                        fakeObject('r1', {
                            position: 1,
                            resultData: JSON.stringify({ Citrat: 'kW' })
                        })
                    ]
                }
            ]
        });

        const result = await useCase.execute({
            orderId: ORDER_ID,
            userEmail: USER_EMAIL
        });

        expect(result).toEqual([
            {
                id: 's1',
                position: 1,
                sampleData: { sample_id: { value: '1' } },
                sampleMeta: { nrl: 'NRL-AR' },
                results: [
                    { id: 'r1', position: 1, resultData: { Citrat: 'kW' } }
                ]
            }
        ]);
    });

    it('returns an empty results array for a sample without results', async () => {
        const { useCase } = makeUseCase({
            samplesWithResults: [
                {
                    sample: fakeObject('s1', {
                        position: 1,
                        sampleData: '{}',
                        sampleMeta: '{}'
                    }),
                    results: []
                }
            ]
        });

        const result = await useCase.execute({
            orderId: ORDER_ID,
            userEmail: USER_EMAIL
        });

        expect(result[0].results).toEqual([]);
    });

    it('parses empty stored data to null and invalid JSON to the raw string', async () => {
        const { useCase } = makeUseCase({
            samplesWithResults: [
                {
                    sample: fakeObject('s1', {
                        position: 1,
                        sampleData: '',
                        sampleMeta: 'not-json'
                    }),
                    results: []
                }
            ]
        });

        const result = await useCase.execute({
            orderId: ORDER_ID,
            userEmail: USER_EMAIL
        });

        expect(result[0].sampleData).toBeNull();
        expect(result[0].sampleMeta).toBe('not-json');
    });

    it('throws OrderNotFoundError when the order does not exist', async () => {
        const { useCase, sampleRepo } = makeUseCase({ order: undefined });

        await expect(
            useCase.execute({ orderId: ORDER_ID, userEmail: USER_EMAIL })
        ).rejects.toBeInstanceOf(OrderNotFoundError);
        expect(sampleRepo.findByOrderWithResults).not.toHaveBeenCalled();
    });

    it('throws OrderAccessForbiddenError when the order belongs to another user', async () => {
        const { useCase, sampleRepo } = makeUseCase({
            order: fakeOrder('someoneElse')
        });

        await expect(
            useCase.execute({ orderId: ORDER_ID, userEmail: USER_EMAIL })
        ).rejects.toBeInstanceOf(OrderAccessForbiddenError);
        expect(sampleRepo.findByOrderWithResults).not.toHaveBeenCalled();
    });
});
