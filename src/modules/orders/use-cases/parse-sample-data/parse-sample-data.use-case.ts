import { UseCase } from '../../../shared/use-cases';
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
