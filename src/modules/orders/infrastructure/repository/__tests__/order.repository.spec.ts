import { EntityId } from '../../../../shared/domain/valueObjects';
import { ObjectKeys } from '../../../../shared/infrastructure/parse-types';
import { OrderRepository } from '../order.repository';

const notEqualToSpy = jest.fn();
const destroyAllSpy = jest.fn(() => Promise.resolve([]));

// Rows returned by MockQuery.find(), keyed by the queried className.
let findResults: Record<string, unknown[]> = {};

class MockQuery {
    constructor(public className: string) {}
    equalTo() {
        return this;
    }
    notEqualTo(field: string, value: unknown) {
        notEqualToSpy(field, value);
        return this;
    }
    containedIn() {
        return this;
    }
    descending() {
        return this;
    }
    limit() {
        return this;
    }
    find() {
        return Promise.resolve(findResults[this.className] ?? []);
    }
}

beforeAll(() => {
    (global as unknown as { Parse: unknown }).Parse = {
        Object: {
            extend: () =>
                class {
                    id?: string;
                },
            destroyAll: destroyAllSpy
        },
        Query: MockQuery,
        User: class {
            id?: string;
        }
    };
});

beforeEach(() => {
    notEqualToSpy.mockClear();
    destroyAllSpy.mockClear();
    findResults = {};
});

describe('OrderRepository.findByUser', () => {
    const repo = new OrderRepository(ObjectKeys.Order);

    it('returns all of the user orders without any deletion filtering', async () => {
        const orders = [{ id: 'order-1' }, { id: 'order-2' }];
        findResults[ObjectKeys.Order] = orders;

        const result = await repo.findByUser(
            EntityId.create({ value: 'user-1' })
        );

        expect(result).toEqual(orders);
        // The query must not narrow the result set at all (no hidden filter).
        expect(notEqualToSpy).not.toHaveBeenCalled();
    });
});

describe('OrderRepository.deleteAllByUser', () => {
    const repo = new OrderRepository(ObjectKeys.Order);

    it('destroys results, then samples, then orders and returns the order count', async () => {
        const orders = [{ id: 'order-1' }, { id: 'order-2' }];
        const samples = [{ id: 'sample-1' }];
        const results = [{ id: 'result-1' }, { id: 'result-2' }];
        findResults[ObjectKeys.Order] = orders;
        findResults[ObjectKeys.Sample] = samples;
        findResults[ObjectKeys.Result] = results;

        const count = await repo.deleteAllByUser(
            EntityId.create({ value: 'user-1' })
        );

        expect(count).toBe(2);
        // Leaf-first ordering: results -> samples -> orders.
        expect(destroyAllSpy).toHaveBeenNthCalledWith(1, results, {
            useMasterKey: true
        });
        expect(destroyAllSpy).toHaveBeenNthCalledWith(2, samples, {
            useMasterKey: true
        });
        expect(destroyAllSpy).toHaveBeenNthCalledWith(3, orders, {
            useMasterKey: true
        });
    });

    it('does nothing when the user has no orders', async () => {
        findResults[ObjectKeys.Order] = [];

        const count = await repo.deleteAllByUser(
            EntityId.create({ value: 'user-1' })
        );

        expect(count).toBe(0);
        expect(destroyAllSpy).not.toHaveBeenCalled();
    });
});
