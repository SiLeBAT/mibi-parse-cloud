import { UseCase } from '../../../shared/useCases';
import {
    AnnotatedSampleDataEntry,
    Order,
    SampleEntry,
    SampleSet
} from '../../domain';
import { antiCorruptionLayers } from '../../legacy';
import { validateOrder } from '../validate-order';
import {
    AutoCorrectedInputError,
    InvalidInputError
} from './submit-order.error';

type SubmitOrderInput = {
    order: Order<SampleEntry<AnnotatedSampleDataEntry>[]>;
};
export class SubmitOrderUseCase
    implements UseCase<SubmitOrderInput, Promise<SampleSet>>
{
    constructor() {}

    async execute({ order }: SubmitOrderInput): Promise<SampleSet> {
        const sampleSet = SampleSet.create({
            data: order.sampleEntryCollection
        });

        const validatedSubmission = await validateOrder.execute({
            userId: order.customer.id,
            sampleSet
        });

        if (validatedSubmission.hasErrors()) {
            throw new InvalidInputError('Contains errors', new Error());
        }

        if (validatedSubmission.hasAutoCorrections()) {
            throw new AutoCorrectedInputError(
                'Has been auto-corrected',
                new Error()
            );
        }
        const { submissionAntiCorruptionLayer } = await antiCorruptionLayers;
        const submissionACLayer = await submissionAntiCorruptionLayer;
        await submissionACLayer.sendSamples(order);
        return validatedSubmission;
    }
}

const submitOrderUseCase = new SubmitOrderUseCase();

export { submitOrderUseCase };
