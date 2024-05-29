export async function createSchema(
    schemaName: string,
    schema: Parse.Schema,
    creationFunction: () => void
) {
    try {
        await schema.get();
        console.log(
            `System Update: Schema for ${schemaName} already exists. Skipping creation`
        );
        return true;
    } catch (error) {
        console.log(
            `System Update: Schema for ${schemaName} does not exist.  Will create it.`
        );
    }

    creationFunction();

    await schema.save();
    console.log('System Update: Finished creating Schema for ' + schemaName);
    return true;
}
