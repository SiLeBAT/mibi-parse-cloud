import { EntityId } from '../../../../shared/domain/valueObjects';
import { ObjectKeys } from '../../../../shared/infrastructure/parse-types';
import { OrderRepository } from '../order.repository';

const notEqualToSpy = jest.fn();

class MockQuery {
    constructor(public className: unknown) {}
    equalTo() {
        return this;
    }
    notEqualTo(field: string, value: unknown) {
        notEqualToSpy(field, value);
        return this;
    }
    descending() {
        return this;
    }
    find() {
        return Promise.resolve([]);
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
        Query: MockQuery,
        User: class {
            id?: string;
        }
    };
});

describe('OrderRepository.findByUser', () => {
    const repo = new OrderRepository(ObjectKeys.Order);

    it('excludes orders marked for deletion from the user order list', async () => {
        await repo.findByUser(EntityId.create({ value: 'user-1' }));

        expect(notEqualToSpy).toHaveBeenCalledWith('markedForDeletion', true);
    });
});
