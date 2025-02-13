import { logger } from '../../../system/logging';

// Should be used for creating a schema.  For an update of an already existing schema, see update-schema
export async function createSchema(
    schemaName: string,
    schema: Parse.Schema,
    creationFunction: () => void
) {
    try {
        await schema.get();
        logger.verbose(
            `System Update: Schema for ${schemaName} already exists. Skipping creation`
        );
        return true;
    } catch (error) {
        logger.verbose(
            `System Update: Schema for ${schemaName} does not exist.  Will create it.`
        );
    }

    creationFunction();

    await schema.save();
    logger.info('System Update: Finished creating Schema for ' + schemaName);
    return true;
}
