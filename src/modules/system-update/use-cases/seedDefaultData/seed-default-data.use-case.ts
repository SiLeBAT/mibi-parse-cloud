import { UseCase } from '../../../shared/use-cases';

class SeedDefaultDataUseCase implements UseCase<null, null> {
    constructor() {}

    async execute(): Promise<null> {
        await this.seedClientDashboard();
        return null;
    }

    // create a default entry if it doesn't exist
    private async seedClientDashboard() {
        const ClientDashboard = Parse.Object.extend('Client_Dashboard');
        const query = new Parse.Query(ClientDashboard);
        const existingEntry = await query.first({ useMasterKey: true });

        if (!existingEntry) {
            const defaultEntry = new ClientDashboard();
            defaultEntry.set('name', 'Alternative welcome page');
            defaultEntry.set('isActive', false);
            await defaultEntry.save(null, { useMasterKey: true });
        }
    }
}

const seedDefaultData = new SeedDefaultDataUseCase();

export { seedDefaultData };
