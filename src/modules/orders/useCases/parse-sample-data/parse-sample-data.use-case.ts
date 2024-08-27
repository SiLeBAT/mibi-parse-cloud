import { UseCase } from '../../../shared/useCases';
import { Order, SampleEntry, SubmissionFormInput } from '../../domain';

export abstract class ParseSampleDataUseCase
    implements UseCase<SubmissionFormInput, Order<SampleEntry<string>[]>>
{
    constructor() {}

    abstract execute(
        params: SubmissionFormInput
    ): Promise<Order<SampleEntry<string>[]>>;
}
