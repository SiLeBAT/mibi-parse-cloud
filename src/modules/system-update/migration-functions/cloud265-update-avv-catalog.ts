import { updateSchema } from './update-schema';

export async function cloud265UpdateAVVCatalog() {
    const schemaName = 'AVV_Catalog';
    const avvCatalogSchema = new Parse.Schema(schemaName);

    const updateFunction = () => {
        avvCatalogSchema.addString('uploadWarning', { required: false });
    };

    const guardFunction = async () => {
        const schemaData = await avvCatalogSchema.get();

        if (schemaData.fields['uploadWarning']) {
            return false;
        }
        return true;
    };

    const result = await updateSchema(
        schemaName,
        avvCatalogSchema,
        updateFunction,
        guardFunction
    );

    return result;
}
