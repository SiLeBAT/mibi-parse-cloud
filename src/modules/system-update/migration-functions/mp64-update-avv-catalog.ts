import { updateSchema } from './update-schema';
export async function mp64UpdateAVVCatalog() {
    const schemaName = 'AVV_Catalog';
    const avvCatalogSchema = new Parse.Schema(schemaName);
    const updateFunction = () => {
        avvCatalogSchema.addString('catalogData');
    };
    const guardFunction = async () => {
        const schemaData = await avvCatalogSchema.get();
        if (schemaData.fields['catalogData']) {
            return false;
        }
        return true;
    };
    return updateSchema(
        schemaName,
        avvCatalogSchema,
        updateFunction,
        guardFunction
    );
}
