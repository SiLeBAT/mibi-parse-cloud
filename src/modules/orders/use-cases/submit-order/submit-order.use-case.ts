import { EntityId } from '../../../shared/domain/valueObjects';
import { UseCase } from '../../../shared/use-cases';
import { AnnotatedSampleDataEntry, Order, SampleEntry } from '../../domain';
import { antiCorruptionLayers } from '../../legacy';
import { SubmissionResult } from '../../legacy/anti-corruption/submission.anti-corruption-layer';
import { createSubmitter } from '../create-submitter';

type SubmitOrderInput = {
    order: Order<SampleEntry<AnnotatedSampleDataEntry>[]>;
    submitterId: EntityId;
};
export class SubmitOrderUseCase
    implements UseCase<SubmitOrderInput, Promise<SubmissionResult>>
{
    constructor() {}

    async execute({
        order,
        submitterId
    }: SubmitOrderInput): Promise<SubmissionResult> {
        const { submissionAntiCorruptionLayer } = await antiCorruptionLayers;
        const submissionACLayer = await submissionAntiCorruptionLayer;
        const submitter = await createSubmitter.execute({
            submitterId: submitterId
        });

        return submissionACLayer.sendSamples(order, submitter);
    }
}

const submitOrderUseCase = new SubmitOrderUseCase();

export { submitOrderUseCase };
