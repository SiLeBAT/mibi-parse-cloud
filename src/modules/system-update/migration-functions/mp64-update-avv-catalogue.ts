import { updateSchema } from './update-schema';
export async function mp64UpdateAVVCatalogue() {
    const schemaName = 'AVV_Catalogue';
    const avvCatalogueSchema = new Parse.Schema(schemaName);
    const updateFunction = () => {
        avvCatalogueSchema.addString('catalogueData');
    };
    const guardFunction = async () => {
        const schemaData = await avvCatalogueSchema.get();
        if (schemaData.fields['catalogueData']) {
            return false;
        }
        return true;
    };
    return updateSchema(
        schemaName,
        avvCatalogueSchema,
        updateFunction,
        guardFunction
    );
}
