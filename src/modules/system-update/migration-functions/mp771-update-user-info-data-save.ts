import { updateSchema } from './update-schema';

export async function mp771UpdateUserInfoDataSave() {
    const schemaName = 'User_Info';
    const userInfoSchema = new Parse.Schema(schemaName);

    const updateFunction = () => {
        userInfoSchema
            .addBoolean('dataSaveAgreed', {
                required: true,
                defaultValue: false
            })
            .addBoolean('dataSaveViewed', {
                required: true,
                defaultValue: false
            });
    };

    const guardFunction = async () => {
        const schemaData = await userInfoSchema.get();

        if (
            schemaData.fields['dataSaveAgreed'] ||
            schemaData.fields['dataSaveViewed']
        ) {
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
