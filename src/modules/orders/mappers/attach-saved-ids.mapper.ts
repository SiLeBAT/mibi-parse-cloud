import { EntityId } from '../../shared/domain/valueObjects';
import { AnnotatedSampleDataEntry, Order, SampleEntry } from '../domain';
import { OrderDTO } from '../dto';

export class AttachSavedIdsMapper {
    static attach(
        order: Order<SampleEntry<AnnotatedSampleDataEntry>[]>,
        savedOrder: OrderDTO
    ): Order<SampleEntry<AnnotatedSampleDataEntry>[]> {
        if (!savedOrder.objectId) {
            throw new Error(
                'Cannot attach saved ids: savedOrder is missing objectId.'
            );
        }
        const entries = order.sampleEntryCollection;
        const savedSamples = savedOrder.sampleSet.samples;
        if (entries.length !== savedSamples.length) {
            throw new Error(
                `Cannot attach saved ids: sample count mismatch (order=${entries.length}, savedOrder=${savedSamples.length}).`
            );
        }

        const enrichedEntries = entries.map((entry, index) => {
            const savedSample = savedSamples[index];
            if (!savedSample.objectId) {
                throw new Error(
                    `Cannot attach saved ids: savedOrder sample at index ${index} is missing objectId.`
                );
            }
            return SampleEntry.create(
                entry.data,
                EntityId.create({ value: savedSample.objectId })
            );
        });

        return Order.create(
            {
                sampleEntryCollection: enrichedEntries,
                customer: order.customer,
                submissionFormInfo: order.submissionFormInfo,
                signatureDate: order.signatureDate,
                comment: order.comment
            },
            EntityId.create({ value: savedOrder.objectId })
        );
    }
}
