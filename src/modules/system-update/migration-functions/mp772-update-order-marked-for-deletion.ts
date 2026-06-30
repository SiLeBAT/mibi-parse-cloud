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

    const result = await updateSchema(
        schemaName,
        orderSchema,
        updateFunction,
        guardFunction
    );

    // The schema defaultValue only applies to orders created after the field is
    // added — existing orders keep markedForDeletion undefined. Backfill them
    // explicitly so the value is always defined (false).
    const OrderClass = Parse.Object.extend(schemaName);
    const ordersWithoutFlag = await new Parse.Query(OrderClass)
        .doesNotExist('markedForDeletion')
        .limit(100000)
        .find({ useMasterKey: true });

    if (ordersWithoutFlag.length > 0) {
        ordersWithoutFlag.forEach(order =>
            order.set('markedForDeletion', false)
        );
        await Parse.Object.saveAll(ordersWithoutFlag, { useMasterKey: true });
    }

    return result;
}
