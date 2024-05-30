import { createSchema } from './create-schema';

export async function mp40CreateAnalysisProcedure() {
    const schemaName = 'Analysis_Procedure';
    const analysisProcedureSchema = new Parse.Schema(schemaName);

    const creationFunction = () => {
        analysisProcedureSchema
            .addNumber('key', { required: true })
            .addString('value', { required: true });

        analysisProcedureSchema.setCLP({
            find: {},
            count: {},
            get: {},
            create: {},
            update: {},
            delete: {},
            addField: {},
            protectedFields: {
                '*': []
            }
        });
    };
    return createSchema(schemaName, analysisProcedureSchema, creationFunction);
}
