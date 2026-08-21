import { updateSchema } from './update-schema';

export async function mp341UpdateOrder() {
    const schemaName = 'Order';
    const orderSchema = new Parse.Schema(schemaName);

    const updateFunction = () => {
        orderSchema.addBoolean('customerCopyFailed', { required: false });
    };

    const guardFunction = async () => {
        const schemaData = await orderSchema.get();

        if (schemaData.fields['customerCopyFailed']) {
            return false;
        }
        return true;
    };

    const result = await updateSchema(
        schemaName,
        orderSchema,
        updateFunction,
        guardFunction
    );

    return result;
}
