import { createSchema } from './create-schema';

export async function mp35CreateAVVCatalog() {
    const schemaName = 'AVV_Catalog';
    const avvCatalogSchema = new Parse.Schema(schemaName);

    const creationFunction = () => {
        avvCatalogSchema
            .addFile('catalogFile', { required: true })
            .addString('catalogCode')
            .addString('version')
            .addDate('validFrom');

        avvCatalogSchema.setCLP({
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
    return createSchema(schemaName, avvCatalogSchema, creationFunction);
}
