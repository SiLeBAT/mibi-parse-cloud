import { updateSchema } from './update-schema';

export async function mp772UpdateUserInfoEmailNotifications() {
    const schemaName = 'User_Info';
    const userInfoSchema = new Parse.Schema(schemaName);

    const updateFunction = () => {
        userInfoSchema
            .addBoolean('emailNotificationsEnabled', {
                required: true,
                defaultValue: false
            })
            .addString('emailNotificationFrequency', {
                required: true,
                defaultValue: 'daily'
            })
            .addString('emailNotificationWeekday', {
                required: true,
                defaultValue: 'monday'
            })
            .addString('emailNotificationWeekOfMonth', {
                required: true,
                defaultValue: '1'
            });
    };

    const guardFunction = async () => {
        const schemaData = await userInfoSchema.get();

        if (schemaData.fields['emailNotificationsEnabled']) {
            return false;
        }
        return true;
    };

    const result = await updateSchema(
        schemaName,
        userInfoSchema,
        updateFunction,
        guardFunction
    );

    // The schema defaultValue only applies to User_Info rows created after the
    // fields are added — existing rows keep the settings undefined. Backfill
    // them explicitly so every user has a defined default configuration.
    const UserInfoClass = Parse.Object.extend(schemaName);
    const rowsWithoutSettings = await new Parse.Query(UserInfoClass)
        .doesNotExist('emailNotificationsEnabled')
        .limit(100000)
        .find({ useMasterKey: true });

    if (rowsWithoutSettings.length > 0) {
        rowsWithoutSettings.forEach(row => {
            row.set('emailNotificationsEnabled', false);
            row.set('emailNotificationFrequency', 'daily');
            row.set('emailNotificationWeekday', 'monday');
            row.set('emailNotificationWeekOfMonth', '1');
        });
        await Parse.Object.saveAll(rowsWithoutSettings, {
            useMasterKey: true
        });
    }

    return result;
}
