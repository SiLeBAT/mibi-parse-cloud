import { submitOrderController } from './submit-order.controller';

export const FUNCTION_KEY = 'submitSampleData';
Parse.Cloud.define(FUNCTION_KEY, submitOrderController);
