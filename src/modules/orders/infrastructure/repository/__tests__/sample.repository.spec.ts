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
});
