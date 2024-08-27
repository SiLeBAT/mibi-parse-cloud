import { UseCase } from '../../../shared/useCases';
import {
    FileInformation,
    Order,
    SampleEntry,
    SampleEntryTuple
} from '../../domain';
import { antiCorruptionLayers } from '../../legacy';

export class CreateSubmissionFileUseCase
    implements UseCase<Order<SampleEntry<SampleEntryTuple>[]>, FileInformation>
{
    constructor() {}

    async execute(
        submission: Order<SampleEntry<SampleEntryTuple>[]>
    ): Promise<FileInformation> {
        const { excelMarshallAntiCorruptionLayer } = await antiCorruptionLayers;
        return excelMarshallAntiCorruptionLayer.convertToExcel(submission);
    }
}

const createSubmissionFileUseCase = new CreateSubmissionFileUseCase();

export { createSubmissionFileUseCase };
