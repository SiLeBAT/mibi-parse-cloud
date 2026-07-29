import { Email, EntityId } from '../../../shared/domain/valueObjects';
import { UseCase } from '../../../shared/use-cases';
import {
    orderRepository,
    OrderRepository,
    userRepository,
    UserRepository
} from '../../infrastructure/repository';

type DeleteOrdersByUserInput = {
    userEmail: string;
};

export class DeleteOrdersByUserUseCase
    implements UseCase<DeleteOrdersByUserInput, Promise<number>>
{
    constructor(
        private orderRepo: OrderRepository,
        private userRepo: UserRepository
    ) {}

    async execute({ userEmail }: DeleteOrdersByUserInput): Promise<number> {
        const email = await Email.create({ value: userEmail });
        const userId: EntityId = await this.userRepo.getIdForEmail(email);

        return this.orderRepo.deleteAllByUser(userId);
    }
}

const deleteOrdersByUser = new DeleteOrdersByUserUseCase(
    orderRepository,
    userRepository
);

export { deleteOrdersByUser };
