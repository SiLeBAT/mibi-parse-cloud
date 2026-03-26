import { createSchema } from './create-schema';

export async function mp87CreateAllowedPLZ() {
    const schemaName = 'Allowed_PLZ';
    const templateFileSchema = new Parse.Schema(schemaName);

    const creationFunction = () => {
        templateFileSchema.addString('plz', { required: true });
        templateFileSchema.addIndex('plz_index', { plz: 1 });
        templateFileSchema.setCLP({
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
    return createSchema(schemaName, templateFileSchema, creationFunction);
}
