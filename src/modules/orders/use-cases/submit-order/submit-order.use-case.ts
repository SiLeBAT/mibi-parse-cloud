import { EntityId } from '../../../shared/domain/valueObjects';
import { UseCase } from '../../../shared/use-cases';
import {
    AnnotatedSampleDataEntry,
    Order,
    SampleEntry,
    SampleSet
} from '../../domain';
import { antiCorruptionLayers } from '../../legacy';
import { createSubmitter } from '../create-submitter';
import { validateOrder } from '../validate-order';
import {
    AutoCorrectedInputError,
    InvalidInputError
} from './submit-order.error';

type SubmitOrderInput = {
    order: Order<SampleEntry<AnnotatedSampleDataEntry>[]>;
    submitterId: EntityId;
};
export class SubmitOrderUseCase
    implements UseCase<SubmitOrderInput, Promise<SampleSet>>
{
    constructor() {}

    async execute({
        order,
        submitterId
    }: SubmitOrderInput): Promise<SampleSet> {
        const sampleSet = SampleSet.create({
            data: order.sampleEntryCollection
        });

        const validatedSubmission = await validateOrder.execute({
            submitterId,
            sampleSet
        });

        if (validatedSubmission.hasErrors()) {
            throw new InvalidInputError(
                'Input validation failed',
                new Error('Input validation failed')
            );
        }

        if (validatedSubmission.hasAutoCorrections()) {
            throw new AutoCorrectedInputError(
                'Has been auto-corrected',
                new Error('Has been auto-corrected')
            );
        }
        const { submissionAntiCorruptionLayer } = await antiCorruptionLayers;
        const submissionACLayer = await submissionAntiCorruptionLayer;
        const submitter = await createSubmitter.execute({
            submitterId: submitterId
        });
        await submissionACLayer.sendSamples(order, submitter);

        return validatedSubmission;
    }
}

const submitOrderUseCase = new SubmitOrderUseCase();

export { submitOrderUseCase };
