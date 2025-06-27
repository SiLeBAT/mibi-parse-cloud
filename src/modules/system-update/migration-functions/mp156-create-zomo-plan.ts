import { createSchema } from './create-schema';

export async function mp156CreateZomoPlan() {
    const schemaName = 'Zomo_Plan';
    const zomoPlanSchema = new Parse.Schema(schemaName);

    const creationFunction = () => {
        zomoPlanSchema
            .addFile('zomoFile', { required: true })
            .addString('zomoData')
            .addString('year');

        zomoPlanSchema.setCLP({
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

    return createSchema(schemaName, zomoPlanSchema, creationFunction);
}
