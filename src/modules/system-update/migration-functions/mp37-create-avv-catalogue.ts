import { createSchema } from './create-schema';

export async function mp35CreateAVVCatalogue() {
    const schemaName = 'AVV_Catalogue';
    const avvCatalogueSchema = new Parse.Schema(schemaName);

    const creationFunction = () => {
        avvCatalogueSchema
            .addFile('catalogueFile', { required: true })
            .addString('catalogueCode')
            .addString('version')
            .addDate('validFrom');

        avvCatalogueSchema.setCLP({
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
    return createSchema(schemaName, avvCatalogueSchema, creationFunction);
}
