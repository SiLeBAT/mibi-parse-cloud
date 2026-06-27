import { createSchema } from './create-schema';

export async function mp228CreateResult() {
    const schemaName = 'Result';
    const resultSchema = new Parse.Schema(schemaName);

    const creationFunction = () => {
        resultSchema.addPointer('sample', 'Sample', { required: true });
        resultSchema.addNumber('position', { required: true });
        resultSchema.addString('resultData');

        resultSchema.setCLP({
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

    return createSchema(schemaName, resultSchema, creationFunction);
}
