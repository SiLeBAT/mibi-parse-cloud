import { updateSchema } from './update-schema';
export async function cloud185UpdateTemplateFile() {
    const schemaName = 'Template_File';
    const templateFileSchema = new Parse.Schema(schemaName);
    const updateFunction = () => {
        templateFileSchema.addString('version');
    };
    const guardFunction = async () => {
        const schemaData = await templateFileSchema.get();
        if (schemaData.fields['version']) {
            return false;
        }
        return true;
    };
    return updateSchema(
        schemaName,
        templateFileSchema,
        updateFunction,
        guardFunction
    );
}
