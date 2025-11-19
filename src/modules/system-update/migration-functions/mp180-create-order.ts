import { createSchema } from './create-schema';

export async function mp180CreateOrder() {
    const schemaName = 'Order';
    const orderSchema = new Parse.Schema(schemaName);

    const creationFunction = () => {
        orderSchema
            .addPointer('user', '_User', { required: true })
            .addString('orderData')
            .addString('excelName');

        orderSchema.setCLP({
            find: {},
            count: {},
            get: {},
            create: {},
            update: {},
            delete: {},
            addField: {}
        });
    };
    return createSchema(schemaName, orderSchema, creationFunction);
}
