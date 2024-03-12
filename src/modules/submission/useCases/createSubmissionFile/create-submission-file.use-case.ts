import { UseCase } from '../../../shared/useCases';
import { FileInformation, SampleEntry, SampleEntryTuple } from '../../domain';
import { excelMarshallAntiCorruptionLayer } from '../../legacy';
import { Submission } from './../../domain';

export class CreateSubmissionFileUseCase
    implements
        UseCase<Submission<SampleEntry<SampleEntryTuple>[]>, FileInformation>
{
    constructor() {}

    execute(
        submission: Submission<SampleEntry<SampleEntryTuple>[]>
    ): Promise<FileInformation> {
        return excelMarshallAntiCorruptionLayer.convertToExcel(submission);
    }
}

const createSubmissionFileUseCase = new CreateSubmissionFileUseCase();

export { createSubmissionFileUseCase };
