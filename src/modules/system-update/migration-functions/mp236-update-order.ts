import { updateSchema } from './update-schema';

export async function mp236UpdateOrder() {
    const schemaName = 'Order';
    const orderSchema = new Parse.Schema(schemaName);

    const updateFunction = () => {
        orderSchema
            .addArray('sampleIds', { required: false })
            .addArray('sampleIdsAVV', { required: false });
    };

    const guardFunction = async () => {
        const schemaData = await orderSchema.get();

        if (
            schemaData.fields['sampleIds'] ||
            schemaData.fields['sampleIdsAVV']
        ) {
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
