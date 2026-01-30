import { UseCase } from '../../../shared/use-cases';
import {
    FileInformation,
    Order,
    SampleEntry,
    SampleEntryTuple,
    SampleEntryV18,
    SampleEntryV18Tuple
} from '../../domain';
import { antiCorruptionLayers } from '../../legacy';

export class CreateSubmissionFileUseCase
    implements UseCase<Order<SampleEntry<SampleEntryTuple>[]>, FileInformation>
{
    constructor() {}

    async execute(
        submission:
            | Order<SampleEntry<SampleEntryTuple>[]>
            | Order<SampleEntryV18<SampleEntryV18Tuple>[]>
    ): Promise<FileInformation> {
        const { excelMarshallAntiCorruptionLayer } = await antiCorruptionLayers;
        return excelMarshallAntiCorruptionLayer.convertToExcel(submission);
    }
}

const createSubmissionFileUseCase = new CreateSubmissionFileUseCase();

export { createSubmissionFileUseCase };
