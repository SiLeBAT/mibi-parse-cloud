import { createSchema } from './create-schema';

export async function mp151CreateClientDashboard() {
    const schemaName = 'Client_Dashboard';
    const clientDashboardSchema = new Parse.Schema(schemaName);

    const creationFunction = () => {
        clientDashboardSchema.addString('name', {
            required: true,
            defaultValue: 'Alternative welcome page'
        });
        clientDashboardSchema.addBoolean('isActive', {
            required: true,
            defaultValue: false
        });

        clientDashboardSchema.setCLP({
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

    const creationResult = await createSchema(
        schemaName,
        clientDashboardSchema,
        creationFunction
    );

    // create a default entry if it doesn't exist
    const ClientDashboard = Parse.Object.extend(schemaName);
    const query = new Parse.Query(ClientDashboard);
    const existingEntry = await query.first({ useMasterKey: true });

    if (!existingEntry) {
        const defaultEntry = new ClientDashboard();
        defaultEntry.set('name', 'Alternative welcome page');
        defaultEntry.set('isActive', false);
        await defaultEntry.save(null, { useMasterKey: true });
    }

    return creationResult;
}
