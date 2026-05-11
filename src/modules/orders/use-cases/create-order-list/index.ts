import {
    CreateOrderListRequestValidation,
    createOrderListController
} from './create-order-list.controller';
export { CreateOrderListUseCase } from './create-order-list.use-case';
export const FUNCTION_KEY = 'createOrderList';
Parse.Cloud.define(
    FUNCTION_KEY,
    createOrderListController,
    CreateOrderListRequestValidation
);
