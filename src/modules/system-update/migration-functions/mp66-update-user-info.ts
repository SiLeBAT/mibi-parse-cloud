import { updateSchema } from './update-schema';

export async function mp66UpdateUserInfo() {
    const schemaName = 'User_Info';
    const userInfoSchema = new Parse.Schema(schemaName);

    const updateFunction = () => {
        userInfoSchema
            .addString('firstName', { required: true })
            .addString('lastName', { required: true });
    };

    const guardFunction = async () => {
        const schemaData = await userInfoSchema.get();

        if (schemaData.fields['firstName'] || schemaData.fields['lastName']) {
            return false;
        }
        return true;
    };
    return updateSchema(
        schemaName,
        userInfoSchema,
        updateFunction,
        guardFunction
    );
}
