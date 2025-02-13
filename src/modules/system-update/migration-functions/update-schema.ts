import { logger } from '../../../system/logging';

//Should be used for updating a schema: Requires a guard function which will prevent the update if it is unnecessary

export async function updateSchema(
    schemaName: string,
    schema: Parse.Schema,
    updateFunction: () => void,
    guardFunction: () => Promise<boolean>
) {
    const proceed = await guardFunction();

    if (proceed) {
        updateFunction();

        await schema.update();
        logger.info(
            'System Update: Finished updating Schema for ' + schemaName
        );
    } else {
        logger.verbose(
            `System Update: Schema update for ${schemaName} not necessary. Changes are already present`
        );
    }

    return true;
}
