import { StoreResultsUseCase } from '../store-results.use-case';
import {
    InvalidResultPayloadError,
    UnknownSamplesError
} from '../store-results.error';

const ORDER_ID = 'order1';

// Minimal Parse.Object stand-in: the use-case only reads id and get('order').
const fakeSample = (id: string, orderId: string = ORDER_ID) => ({
    id,
    get: (key: string) => (key === 'order' ? { id: orderId } : undefined)
});

type UseCaseHarness = {
    useCase: StoreResultsUseCase;
    orderRepo: { updateResultsCounter: jest.Mock };
    sampleRepo: { findByIds: jest.Mock; findByOrder: jest.Mock };
    resultRepo: {
        findMaxPositionsBySample: jest.Mock;
        saveResults: jest.Mock;
        countSamplesWithResults: jest.Mock;
    };
};

const makeUseCase = (
    overrides: {
        samples?: unknown[];
        orderSamples?: unknown[];
        maxPositions?: Map<string, number>;
        coveredSampleCount?: number;
    } = {}
): UseCaseHarness => {
    const samples = overrides.samples ?? [fakeSample('s1')];

    const orderRepo = {
        updateResultsCounter: jest.fn().mockResolvedValue(undefined)
    };
    const sampleRepo = {
        findByIds: jest.fn().mockResolvedValue(samples),
        findByOrder: jest
            .fn()
            .mockResolvedValue(overrides.orderSamples ?? samples)
    };
    const resultRepo = {
        findMaxPositionsBySample: jest
            .fn()
            .mockResolvedValue(overrides.maxPositions ?? new Map()),
        // Stands in for Parse assigning an objectId on save.
        saveResults: jest
            .fn()
            .mockImplementation((newResults: unknown[]) =>
                Promise.resolve(
                    newResults.map((_, index) => ({ id: `r${index + 1}` }))
                )
            ),
        countSamplesWithResults: jest
            .fn()
            .mockResolvedValue(overrides.coveredSampleCount ?? 1)
    };

    const useCase = new StoreResultsUseCase(
        orderRepo as never,
        sampleRepo as never,
        resultRepo as never
    );

    return { useCase, orderRepo, sampleRepo, resultRepo };
};

describe('StoreResultsUseCase', () => {
    describe('storing', () => {
        it('creates one Result per payload element and stringifies the result data', async () => {
            const { useCase, resultRepo } = makeUseCase();

            await useCase.execute({
                results: [{ s1: { Citrat: 'kW', 'O-AG': '166' } }]
            });

            const saved = resultRepo.saveResults.mock.calls[0][0];
            expect(saved).toHaveLength(1);
            expect(saved[0].resultData).toBe(
                JSON.stringify({ Citrat: 'kW', 'O-AG': '166' })
            );
            expect(saved[0].sample.id).toBe('s1');
        });

        it('numbers two results for the same sample consecutively', async () => {
            // This is the case a JSON object keyed by sample id cannot express,
            // and the reason the payload is an array.
            const { useCase, resultRepo } = makeUseCase();

            await useCase.execute({
                results: [
                    { s1: { Serovar: 'S. Typhimurium' } },
                    { s1: { Serovar: 'S. Brandenburg' } }
                ]
            });

            const saved = resultRepo.saveResults.mock.calls[0][0];
            expect(saved.map((r: { position: number }) => r.position)).toEqual([
                1, 2
            ]);
        });

        it('continues the numbering from the results a sample already has', async () => {
            const { useCase, resultRepo } = makeUseCase({
                maxPositions: new Map([['s1', 2]])
            });

            await useCase.execute({
                results: [
                    { s1: { Serovar: 'S. Typhimurium' } },
                    { s1: { Serovar: 'S. Brandenburg' } }
                ]
            });

            const saved = resultRepo.saveResults.mock.calls[0][0];
            expect(saved.map((r: { position: number }) => r.position)).toEqual([
                3, 4
            ]);
        });

        it('numbers each sample independently', async () => {
            const { useCase, resultRepo } = makeUseCase({
                samples: [fakeSample('s1'), fakeSample('s2')],
                maxPositions: new Map([['s1', 1]])
            });

            await useCase.execute({
                results: [{ s1: { A: 'x' } }, { s2: { A: 'y' } }]
            });

            const saved = resultRepo.saveResults.mock.calls[0][0];
            expect(saved.map((r: { position: number }) => r.position)).toEqual([
                2, 1
            ]);
        });

        it('reports the objectId, sample and position of every created row', async () => {
            const { useCase } = makeUseCase();

            const out = await useCase.execute({
                results: [{ s1: { A: 'x' } }, { s1: { A: 'y' } }]
            });

            expect(out.storedResultCount).toBe(2);
            expect(out.created).toEqual([
                { objectId: 'r1', sampleObjectId: 's1', position: 1 },
                { objectId: 'r2', sampleObjectId: 's1', position: 2 }
            ]);
        });
    });

    describe('unknown samples', () => {
        it('writes nothing and names every unknown objectId', async () => {
            const { useCase, resultRepo } = makeUseCase({
                samples: [fakeSample('s1')]
            });

            const attempt = useCase.execute({
                results: [
                    { s1: { A: 'x' } },
                    { nope1: { A: 'y' } },
                    { nope2: { A: 'z' } }
                ]
            });

            await expect(attempt).rejects.toBeInstanceOf(UnknownSamplesError);
            await expect(attempt).rejects.toThrow(/nope1, nope2/);
            expect(resultRepo.saveResults).not.toHaveBeenCalled();
        });
    });

    describe('order counter', () => {
        it('recalculates the counter once per affected order', async () => {
            const { useCase, orderRepo } = makeUseCase({
                samples: [fakeSample('s1'), fakeSample('s2')],
                orderSamples: [
                    fakeSample('s1'),
                    fakeSample('s2'),
                    fakeSample('s3')
                ],
                coveredSampleCount: 2
            });

            const out = await useCase.execute({
                results: [{ s1: { A: 'x' } }, { s2: { A: 'y' } }]
            });

            expect(orderRepo.updateResultsCounter).toHaveBeenCalledTimes(1);
            expect(orderRepo.updateResultsCounter.mock.calls[0][0].value).toBe(
                ORDER_ID
            );
            expect(orderRepo.updateResultsCounter.mock.calls[0][1]).toBe('2/3');
            expect(out.orders).toEqual([{ orderId: ORDER_ID, results: '2/3' }]);
        });

        it('updates every order the import touched', async () => {
            const { useCase, orderRepo } = makeUseCase({
                samples: [
                    fakeSample('s1', 'orderA'),
                    fakeSample('s2', 'orderB')
                ]
            });

            const out = await useCase.execute({
                results: [{ s1: { A: 'x' } }, { s2: { A: 'y' } }]
            });

            expect(orderRepo.updateResultsCounter).toHaveBeenCalledTimes(2);
            expect(out.orders.map(order => order.orderId)).toEqual([
                'orderA',
                'orderB'
            ]);
        });
    });

    describe('payload validation', () => {
        const expectRejected = async (results: unknown) => {
            const { useCase, sampleRepo, resultRepo } = makeUseCase();
            const attempt = useCase.execute({ results: results as never });

            await expect(attempt).rejects.toBeInstanceOf(
                InvalidResultPayloadError
            );
            // Refused before anything is read or written.
            expect(sampleRepo.findByIds).not.toHaveBeenCalled();
            expect(resultRepo.saveResults).not.toHaveBeenCalled();
        };

        it('rejects an object instead of an array', async () => {
            await expectRejected({ s1: { A: 'x' } });
        });

        it('rejects an empty array', async () => {
            await expectRejected([]);
        });

        it('rejects an element that is not an object', async () => {
            await expectRejected(['s1']);
        });

        it('rejects an element with more than one sample id', async () => {
            await expectRejected([{ s1: { A: 'x' }, s2: { A: 'y' } }]);
        });

        it('rejects an element with no sample id', async () => {
            await expectRejected([{}]);
        });

        it('rejects result data that is not an object', async () => {
            await expectRejected([{ s1: 'not-an-object' }]);
        });

        it('rejects an array result value', async () => {
            // The client renders values with String(), which would turn an
            // array into "1,2" and a nested object into "[object Object]".
            await expectRejected([{ s1: { A: [1, 2] } }]);
        });

        it('rejects a nested object result value', async () => {
            await expectRejected([{ s1: { A: { nested: 'v' } } }]);
        });

        it('accepts empty string values, which the test data contains', async () => {
            const { useCase, resultRepo } = makeUseCase();

            await useCase.execute({ results: [{ s1: { CHL: '', CIP: '' } }] });

            expect(resultRepo.saveResults).toHaveBeenCalled();
        });
    });

    describe('result value types', () => {
        // The LIMS sends values as JSON as they are. The real test file
        // V18_BfRResults_9NRLs holds 312 strings, 9 numbers and 28 nulls.
        const savedResultData = async (resultData: unknown) => {
            const { useCase, resultRepo } = makeUseCase();

            await useCase.execute({
                results: [{ s1: resultData }] as never
            });

            return resultRepo.saveResults.mock.calls[0][0][0].resultData;
        };

        it('accepts a number and stores it unquoted', async () => {
            expect(await savedResultData({ Biotyp: 4 })).toBe('{"Biotyp":4}');
        });

        it('accepts null and stores it unquoted', async () => {
            expect(await savedResultData({ 'MHK CHL': null })).toBe(
                '{"MHK CHL":null}'
            );
        });

        it('accepts a boolean', async () => {
            expect(await savedResultData({ flag: true })).toBe('{"flag":true}');
        });

        it('accepts zero and a decimal, which are falsy but valid', async () => {
            expect(await savedResultData({ a: 0, b: -0.25 })).toBe(
                '{"a":0,"b":-0.25}'
            );
        });

        it('keeps the JSON type of every value in a mixed Yersinia entry', async () => {
            const resultData = {
                Gattung: 'Yersinia',
                Spezies: 'enterocolitica',
                Biotyp: 4,
                Serotyp: '',
                'O-Antigen': 'O:3',
                'MHK CHL': null
            };

            expect(await savedResultData(resultData)).toBe(
                JSON.stringify(resultData)
            );
        });
    });
});
