import { createSchema } from './create-schema';

export async function mp35CreateAVVCatalog() {
    const schemaName = 'AVV_Catalogue';
    const avvCatalogSchema = new Parse.Schema(schemaName);

    const creationFunction = () => {
        avvCatalogSchema
            .addFile('catalogueFile', { required: true })
            .addString('catalogueCode')
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
