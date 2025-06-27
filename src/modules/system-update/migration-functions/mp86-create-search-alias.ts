import { createSchema } from './create-schema';

export async function mp86CreateSearchAlias() {
    const schemaName = 'Search_Alias';
    const searchAliasFileSchema = new Parse.Schema(schemaName);

    const creationFunction = () => {
        searchAliasFileSchema
            .addString('catalog')
            .addString('token', { required: true })
            .addArray('alias', { required: true });
        searchAliasFileSchema.addIndex('token_index', { token: 1 });
        searchAliasFileSchema.setCLP({
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
    return createSchema(schemaName, searchAliasFileSchema, creationFunction);
}
