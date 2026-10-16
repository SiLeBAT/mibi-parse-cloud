import { updateSchema } from './update-schema';

export async function mp267UpdateNrl() {
    const schemaName = 'NRL';
    const nrlSchema = new Parse.Schema(schemaName);

    const updateFunction = () => {
        nrlSchema
            .addString('full_name', { required: false })
            .addString('pathogen', { required: false });
    };

    const guardFunction = async () => {
        const schemaData = await nrlSchema.get();

        if (schemaData.fields['full_name'] || schemaData.fields['pathogen']) {
            return false;
        }
        return true;
    };

    const result = await updateSchema(
        schemaName,
        nrlSchema,
        updateFunction,
        guardFunction
    );

    return result;
}
