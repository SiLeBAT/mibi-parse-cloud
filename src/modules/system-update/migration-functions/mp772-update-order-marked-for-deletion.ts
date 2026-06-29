import { updateSchema } from './update-schema';

export async function mp772UpdateOrderMarkedForDeletion() {
    const schemaName = 'Order';
    const orderSchema = new Parse.Schema(schemaName);

    const updateFunction = () => {
        orderSchema
            .addBoolean('markedForDeletion', {
                required: true,
                defaultValue: false
            })
            .addDate('markedForDeletionAt');
    };

    const guardFunction = async () => {
        const schemaData = await orderSchema.get();

        if (
            schemaData.fields['markedForDeletion'] ||
            schemaData.fields['markedForDeletionAt']
        ) {
            return false;
        }
        return true;
    };
    return updateSchema(schemaName, orderSchema, updateFunction, guardFunction);
}
