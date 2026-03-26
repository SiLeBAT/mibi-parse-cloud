import { createSchema } from './create-schema';

export async function mp38CreateAdditionalPathogens() {
    const schemaName = 'Additional_Pathogens';
    const additionalPathogensSchema = new Parse.Schema(schemaName);

    const creationFunction = () => {
        additionalPathogensSchema.addString('pathogen', { required: true });

        additionalPathogensSchema.setCLP({
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
    return createSchema(
        schemaName,
        additionalPathogensSchema,
        creationFunction
    );
}
