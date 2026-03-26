import { createSchema } from './create-schema';

export async function mp39CreateNRL() {
    const schemaName = 'NRL';
    const nrlSchema = new Parse.Schema(schemaName);

    const creationFunction = () => {
        nrlSchema
            .addString('name', { required: true })
            .addString('email', { required: true })
            .addArray('selector', { required: true })
            .addArray('standardProcedures')
            .addArray('optionalProcedures');

        nrlSchema.setCLP({
            find: {},
            count: {},
            get: {
                '*': true
            },
            create: {},
            update: {},
            delete: {},
            addField: {},
            protectedFields: {
                '*': []
            }
        });
    };
    return createSchema(schemaName, nrlSchema, creationFunction);
}
