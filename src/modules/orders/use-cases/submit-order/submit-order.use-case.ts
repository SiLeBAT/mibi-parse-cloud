import { EntityId } from '../../../shared/domain/valueObjects';
import { UseCase } from '../../../shared/use-cases';
import { AnnotatedSampleDataEntry, Order, SampleEntry } from '../../domain';
import { antiCorruptionLayers } from '../../legacy';
import { createSubmitter } from '../create-submitter';

type SubmitOrderInput = {
    order: Order<SampleEntry<AnnotatedSampleDataEntry>[]>;
    submitterId: EntityId;
};
export class SubmitOrderUseCase
    implements UseCase<SubmitOrderInput, Promise<void>>
{
    constructor() {}

    async execute({ order, submitterId }: SubmitOrderInput): Promise<void> {
        const { submissionAntiCorruptionLayer } = await antiCorruptionLayers;
        const submissionACLayer = await submissionAntiCorruptionLayer;
        const submitter = await createSubmitter.execute({
            submitterId: submitterId
        });

        await submissionACLayer.sendSamples(order, submitter);
    }
}

const submitOrderUseCase = new SubmitOrderUseCase();

export { submitOrderUseCase };
