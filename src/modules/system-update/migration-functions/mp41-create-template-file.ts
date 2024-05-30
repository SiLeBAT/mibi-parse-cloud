import { createSchema } from './create-schema';

export async function mp41CreateTemplateFile() {
    const schemaName = 'Template_File';
    const templateFileSchema = new Parse.Schema(schemaName);

    const creationFunction = () => {
        templateFileSchema
            .addFile('templateFile', { required: true })
            .addString('key');

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
