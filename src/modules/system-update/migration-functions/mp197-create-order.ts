import { createSchema } from './create-schema';

export async function mp197CreateOrder() {
    const schemaName = 'Order';
    const orderSchema = new Parse.Schema(schemaName);

    const creationFunction = () => {
        orderSchema.addPointer('user', '_User', { required: true });
        orderSchema.addString('fileName');
        orderSchema.addArray('pathogens');
        orderSchema.addArray('nrls');
        orderSchema.addNumber('sampleCount');
        orderSchema.addString('results');
        orderSchema.addString('meta');

        orderSchema.setCLP({
            find: { '*': true },
            count: { '*': true },
            get: { '*': true },
            create: {},
            update: {},
            delete: {},
            addField: {},
            protectedFields: {
                '*': []
            }
        });
    };

    return createSchema(schemaName, orderSchema, creationFunction);
}
