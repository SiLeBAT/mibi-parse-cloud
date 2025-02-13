import { createSchema } from './create-schema';

export async function mp86reateSearchAlias() {
    const schemaName = 'Search_Alias';
    const templateFileSchema = new Parse.Schema(schemaName);

    const creationFunction = () => {
        templateFileSchema
            .addString('catalog')
            .addString('token', { required: true })
            .addArray('alias', { required: true });
        templateFileSchema.addIndex('token_index', { token: 1 });
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
