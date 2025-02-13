import { UseCase } from '../../../shared/use-cases';
import { UPDATE_FUNCTION_ARRAY } from '../../migration-functions';

class UpdateSchemaUseCase implements UseCase<null, null> {
    constructor() {}

    async execute(): Promise<null> {
        UPDATE_FUNCTION_ARRAY.forEach(async updateFunction => {
            const success = await updateFunction();
            if (success !== true) {
                throw new Error('Failed to update DB.');
            }
        });
        return null;
    }
}

const updateSchema = new UpdateSchemaUseCase();

export { updateSchema };
