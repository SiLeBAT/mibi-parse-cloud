import { Email, EntityId } from '../../../shared/domain/valueObjects';
import { OrderObject } from '../../../shared/infrastructure/parse-types';
import { UseCase } from '../../../shared/use-cases';
import { OrderEntryDTO } from '../../dto';
import {
    orderRepository,
    OrderRepository,
    userRepository,
    UserRepository
} from '../../infrastructure/repository';

type CreateOrderListInput = {
    userEmail: string;
};

export class CreateOrderListUseCase
    implements UseCase<CreateOrderListInput, Promise<OrderEntryDTO[]>>
{
    constructor(
        private orderRepo: OrderRepository,
        private userRepo: UserRepository
    ) {}

    async execute({
        userEmail
    }: CreateOrderListInput): Promise<OrderEntryDTO[]> {
        const email = await Email.create({ value: userEmail });
        const userId: EntityId = await this.userRepo.getIdForEmail(email);

        const orders: OrderObject[] = await this.orderRepo.findByUser(userId);

        return orders.map(order => this.toOrderEntryDTO(order));
    }

    private toOrderEntryDTO(order: OrderObject): OrderEntryDTO {
        const metaRaw = order.get('meta');
        const meta = this.parseMeta(metaRaw);

        return {
            id: order.id ?? '',
            createdAt: order.createdAt ?? new Date(0),
            sampleCount: order.get('sampleCount') ?? 0,
            version: meta.version ?? '',
            fileName: order.get('fileName') ?? meta.fileName ?? '',
            nrls: order.get('nrls') ?? [],
            pathogens: order.get('pathogens') ?? [],
            results: order.get('results') ?? ''
        };
    }

    private parseMeta(metaRaw: unknown): {
        version?: string;
        fileName?: string;
    } {
        if (typeof metaRaw !== 'string' || metaRaw.length === 0) {
            return {};
        }
        try {
            return JSON.parse(metaRaw);
        } catch {
            return {};
        }
    }
}

const createOrderList = new CreateOrderListUseCase(
    orderRepository,
    userRepository
);

export { createOrderList };
