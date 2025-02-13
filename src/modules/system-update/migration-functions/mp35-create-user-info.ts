import { createSchema } from './create-schema';

export async function mp35CreateUserInfo() {
    const schemaName = 'User_Info';
    const userInfoSchema = new Parse.Schema(schemaName);

    const creationFunction = () => {
        userInfoSchema
            .addPointer('user', '_User', { required: true })
            .addPointer('institute', 'institutions');

        userInfoSchema.setCLP({
            find: {},
            count: {},
            get: {},
            create: {},
            update: {},
            delete: {},
            addField: {}
        });
    };
    return createSchema(schemaName, userInfoSchema, creationFunction);
}
