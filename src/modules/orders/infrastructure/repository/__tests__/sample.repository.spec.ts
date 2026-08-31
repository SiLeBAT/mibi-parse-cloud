import { EntityId } from '../../../../shared/domain/valueObjects';
import { ObjectKeys } from '../../../../shared/infrastructure/parse-types';
import { SampleRepository } from '../sample.repository';

// Mock Parse stand-ins used by SampleRepository / AbstractRepository at runtime.
const fakeSample = (id: string, position: number) => ({
    id,
    get: (key: string) => (({ position } as Record<string, unknown>)[key])
});
const fakeResult = (id: string, sampleId: string, position: number) => ({
    id,
    get: (key: string) =>
        key === 'sample'
            ? { id: sampleId }
            : ({ position } as Record<string, unknown>)[key]
});

let sampleData: unknown[];
let resultData: unknown[];

// Limits applied per query class, so a test can assert both queries were
// bounded rather than left on Parse's default page size of 100.
let appliedLimits: Record<string, number>;

class MockQuery {
    constructor(private className: string) {}
    equalTo() {
        return this;
    }
    ascending() {
        return this;
    }
    containedIn() {
        return this;
    }
    limit(value: number) {
        appliedLimits[this.className] = value;
        return this;
    }
    find() {
        return Promise.resolve(
            this.className === ObjectKeys.Result ? resultData : sampleData
        );
    }
}

beforeAll(() => {
    (global as unknown as { Parse: unknown }).Parse = {
        Object: {
            extend: () =>
                class {
                    id?: string;
                }
        },
        Query: MockQuery
    };
});

describe('SampleRepository.findByOrderWithResults', () => {
    const repo = new SampleRepository(ObjectKeys.Sample);
    const orderId = EntityId.create({ value: 'order1' });

    beforeEach(() => {
        appliedLimits = {};
    });

    it('groups results under their sample by the sample pointer id', async () => {
        sampleData = [fakeSample('s1', 1), fakeSample('s2', 2)];
        // s1 has two results, s2 has none
        resultData = [fakeResult('r1', 's1', 1), fakeResult('r2', 's1', 2)];

        const out = await repo.findByOrderWithResults(orderId);

        expect(out.map(e => e.sample.id)).toEqual(['s1', 's2']);
        expect(out[0].results.map(r => r.id)).toEqual(['r1', 'r2']);
        expect(out[1].results).toEqual([]);
    });

    it('returns an empty array and does not query results when there are no samples', async () => {
        sampleData = [];
        resultData = [fakeResult('r1', 's1', 1)]; // must be ignored
        const resultSpy = jest.spyOn(MockQuery.prototype, 'find');
        resultSpy.mockClear();

        const out = await repo.findByOrderWithResults(orderId);

        expect(out).toEqual([]);
        // only the sample query ran, never the result query
        expect(resultSpy).toHaveBeenCalledTimes(1);
        resultSpy.mockRestore();
    });

    it("returns every sample of an order larger than Parse's default page size", async () => {
        sampleData = Array.from({ length: 204 }, (_, i) =>
            fakeSample(`s${i + 1}`, i + 1)
        );
        resultData = sampleData.map((_, i) =>
            fakeResult(`r${i + 1}`, `s${i + 1}`, 1)
        );

        const out = await repo.findByOrderWithResults(orderId);

        expect(out).toHaveLength(204);
        expect(out[203].results.map(r => r.id)).toEqual(['r204']);
    });

    it('bounds both queries so Parse does not truncate at 100', async () => {
        sampleData = [fakeSample('s1', 1)];
        resultData = [fakeResult('r1', 's1', 1)];

        await repo.findByOrderWithResults(orderId);

        expect(appliedLimits[ObjectKeys.Sample]).toBeGreaterThan(100);
        expect(appliedLimits[ObjectKeys.Result]).toBeGreaterThan(100);
    });
});
