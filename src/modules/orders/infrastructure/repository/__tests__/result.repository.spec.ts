import { ObjectKeys } from '../../../../shared/infrastructure/parse-types';
import { ResultRepository } from '../result.repository';

// Mock Parse stand-ins used by ResultRepository / AbstractRepository at runtime.
const fakeSample = (id: string) => ({ id } as never);
const fakeResult = (sampleId: string, position: number) => ({
    get: (key: string) =>
        key === 'sample'
            ? { id: sampleId }
            : ({ position } as Record<string, unknown>)[key]
});

let storedResults: unknown[];
let appliedLimits: Record<string, number>;
let saveAll: jest.Mock;
let destroyAll: jest.Mock;

class MockResultObject {
    id?: string;
    private attributes: Record<string, unknown>;
    constructor(attributes: Record<string, unknown> = {}) {
        this.attributes = attributes;
    }
    get(key: string) {
        return this.attributes[key];
    }
}

class MockQuery {
    constructor(private className: string) {}
    containedIn() {
        return this;
    }
    limit(value: number) {
        appliedLimits[this.className] = value;
        return this;
    }
    find() {
        return Promise.resolve(storedResults);
    }
}

beforeAll(() => {
    (global as unknown as { Parse: unknown }).Parse = {
        Object: {
            extend: () => MockResultObject,
            saveAll: (...args: unknown[]) => saveAll(...args),
            destroyAll: (...args: unknown[]) => destroyAll(...args)
        },
        Query: MockQuery
    };
});

beforeEach(() => {
    appliedLimits = {};
    storedResults = [];
    // Stands in for Parse assigning an objectId on save.
    saveAll = jest.fn().mockImplementation((objects: MockResultObject[]) => {
        objects.forEach((object, index) => {
            object.id = `r${index + 1}`;
        });
        return Promise.resolve(objects);
    });
    destroyAll = jest.fn().mockResolvedValue(undefined);
});

const repo = new ResultRepository(ObjectKeys.Result);

describe('ResultRepository.findMaxPositionsBySample', () => {
    it('reports the highest position per sample', async () => {
        storedResults = [
            fakeResult('s1', 1),
            fakeResult('s1', 3),
            fakeResult('s1', 2),
            fakeResult('s2', 1)
        ];

        const out = await repo.findMaxPositionsBySample([
            fakeSample('s1'),
            fakeSample('s2')
        ]);

        expect(out.get('s1')).toBe(3);
        expect(out.get('s2')).toBe(1);
    });

    it('omits samples that have no results, so numbering starts at 1', async () => {
        storedResults = [fakeResult('s1', 1)];

        const out = await repo.findMaxPositionsBySample([
            fakeSample('s1'),
            fakeSample('s2')
        ]);

        expect(out.has('s2')).toBe(false);
    });

    it('does not query when there are no samples', async () => {
        const findSpy = jest.spyOn(MockQuery.prototype, 'find');
        findSpy.mockClear();

        const out = await repo.findMaxPositionsBySample([]);

        expect(out.size).toBe(0);
        expect(findSpy).not.toHaveBeenCalled();
        findSpy.mockRestore();
    });

    it('bounds the query so Parse does not truncate at 100', async () => {
        // A truncated read would hide existing results and restart the
        // position numbering part-way through an order.
        storedResults = [fakeResult('s1', 1)];

        await repo.findMaxPositionsBySample([fakeSample('s1')]);

        expect(appliedLimits[ObjectKeys.Result]).toBeGreaterThan(100);
    });
});

describe('ResultRepository.saveResults', () => {
    const newResults = [
        { sample: fakeSample('s1'), position: 1, resultData: '{"A":"x"}' },
        { sample: fakeSample('s1'), position: 2, resultData: '{"A":"y"}' }
    ];

    it('saves every row with the master key and returns them with their ids', async () => {
        const out = await repo.saveResults(newResults);

        expect(saveAll).toHaveBeenCalledWith(expect.any(Array), {
            useMasterKey: true
        });
        expect(out.map(result => result.id)).toEqual(['r1', 'r2']);
    });

    it('carries sample, position and resultData onto the created objects', async () => {
        const out = await repo.saveResults(newResults);

        expect(out[1].get('position')).toBe(2);
        expect(out[1].get('resultData')).toBe('{"A":"y"}');
        expect(out[1].get('sample')).toEqual({ id: 's1' });
    });

    it('does nothing when there is nothing to save', async () => {
        const out = await repo.saveResults([]);

        expect(out).toEqual([]);
        expect(saveAll).not.toHaveBeenCalled();
    });

    it('destroys the rows that did persist when the save fails', async () => {
        // Otherwise a failed import leaves the order half-populated.
        saveAll = jest
            .fn()
            .mockImplementation((objects: MockResultObject[]) => {
                objects[0].id = 'r1';
                return Promise.reject(new Error('save failed'));
            });

        await expect(repo.saveResults(newResults)).rejects.toThrow(
            'save failed'
        );
        expect(destroyAll).toHaveBeenCalledWith(
            [expect.objectContaining({ id: 'r1' })],
            { useMasterKey: true }
        );
    });

    it('still reports the original failure when the rollback also fails', async () => {
        saveAll = jest
            .fn()
            .mockImplementation((objects: MockResultObject[]) => {
                objects[0].id = 'r1';
                return Promise.reject(new Error('save failed'));
            });
        destroyAll = jest.fn().mockRejectedValue(new Error('rollback failed'));
        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await expect(repo.saveResults(newResults)).rejects.toThrow(
            'save failed'
        );
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});

describe('ResultRepository.countSamplesWithResults', () => {
    it('counts samples, not results', async () => {
        storedResults = [
            fakeResult('s1', 1),
            fakeResult('s1', 2),
            fakeResult('s2', 1)
        ];

        const out = await repo.countSamplesWithResults([
            fakeSample('s1'),
            fakeSample('s2'),
            fakeSample('s3')
        ]);

        expect(out).toBe(2);
    });

    it('is zero when there are no samples', async () => {
        expect(await repo.countSamplesWithResults([])).toBe(0);
    });
});
