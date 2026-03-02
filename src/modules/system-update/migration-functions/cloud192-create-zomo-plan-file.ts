import { createSchema } from './create-schema';

export async function cloud192CreateZomoPlanFile() {
    const schemaName = 'Zomo_Plan_File';
    const zomoPlanFileSchema = new Parse.Schema(schemaName);

    const creationFunction = () => {
        zomoPlanFileSchema
            .addFile('zomoPlanFile', { required: true })
            .addString('year', { required: true });

        zomoPlanFileSchema.setCLP({
            find: { '*': true },
            count: { '*': true },
            get: { '*': true },
            create: {},
            update: {},
            delete: {},
            addField: {},
            protectedFields: {
                '*': []
            }
        });
    };
    return createSchema(schemaName, zomoPlanFileSchema, creationFunction);
}
