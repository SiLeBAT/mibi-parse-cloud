import { UseCase } from '../../../shared/use-cases';
import { UPDATE_FUNCTION_ARRAY } from '../../migration-functions';

class UpdateSchemaUseCase implements UseCase<null, null> {
    constructor() {}

    async execute(): Promise<null> {
        // Sequential on purpose. `forEach` does not await an async callback, so the
        // migrations all started at once and ran in arbitrary order, while the array
        // is explicitly ordered ("add new functions at the BOTTOM"). On a database
        // that already has the classes this went unnoticed; on an empty one the
        // update functions raced the create functions and threw "Class X does not
        // exist" from an unawaited promise, which took the whole server down at
        // start-up. A plain loop keeps the declared order and lets errors propagate.
        for (const updateFunction of UPDATE_FUNCTION_ARRAY) {
            const success = await updateFunction();
            if (success !== true) {
                throw new Error('Failed to update DB.');
            }
        }
        return null;
    }
}

const updateSchema = new UpdateSchemaUseCase();

export { updateSchema };
