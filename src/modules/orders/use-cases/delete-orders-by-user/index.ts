import {
    DeleteOrdersByUserRequestValidation,
    deleteOrdersByUserController
} from './delete-orders-by-user.controller';
export { DeleteOrdersByUserUseCase } from './delete-orders-by-user.use-case';
export const FUNCTION_KEY = 'deleteOrdersByUser';
Parse.Cloud.define(
    FUNCTION_KEY,
    deleteOrdersByUserController,
    DeleteOrdersByUserRequestValidation
);
