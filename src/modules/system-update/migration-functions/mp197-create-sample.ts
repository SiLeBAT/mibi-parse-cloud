import { createSchema } from './create-schema';

export async function mp197CreateSample() {
    const schemaName = 'Sample';
    const sampleSchema = new Parse.Schema(schemaName);

    const creationFunction = () => {
        sampleSchema.addPointer('order', 'Order', { required: true });
        sampleSchema.addNumber('position', { required: true });
        sampleSchema.addString('sampleData');
        sampleSchema.addString('sampleMeta');

        sampleSchema.setCLP({
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

    return createSchema(schemaName, sampleSchema, creationFunction);
}
