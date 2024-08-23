import { logger } from '../../../system/logging';

export async function updateSchema(
    schemaName: string,
    schema: Parse.Schema,
    updateFunction: () => void
) {
    updateFunction();

    await schema.update();
    logger.info('System Update: Finished updating Schema for ' + schemaName);
    return true;
}
