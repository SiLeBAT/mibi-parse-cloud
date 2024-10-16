import { UseCase } from '../../../shared/useCases';
import {
    Order,
    SampleEntry,
    SampleEntryTuple,
    SubmissionFormInput
} from '../../domain';

export abstract class ParseSampleDataUseCase
    implements
        UseCase<SubmissionFormInput, Order<SampleEntry<SampleEntryTuple>[]>>
{
    constructor() {}

    abstract execute(
        params: SubmissionFormInput
    ): Promise<Order<SampleEntry<SampleEntryTuple>[]>>;
}
