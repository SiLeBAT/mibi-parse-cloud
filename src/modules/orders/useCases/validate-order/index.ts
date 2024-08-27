import {
    ValidateOrderRequestValidation,
    validateOrderController
} from './validate-order.controller';

export { validateOrder } from './validate-order.use-case';

export const FUNCTION_KEY = 'validateSampleData';
Parse.Cloud.define(
    FUNCTION_KEY,
    validateOrderController,
    ValidateOrderRequestValidation
);
