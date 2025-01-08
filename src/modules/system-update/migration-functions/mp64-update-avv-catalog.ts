import { updateSchema } from './update-schema';
export async function mp64UpdateAVVCatalog() {
    const schemaName = 'AVV_Catalogue';
    const avvCatalogSchema = new Parse.Schema(schemaName);
    const updateFunction = () => {
        avvCatalogSchema.addString('catalogueData');
    };
    const guardFunction = async () => {
        const schemaData = await avvCatalogSchema.get();
        if (schemaData.fields['catalogueData']) {
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
