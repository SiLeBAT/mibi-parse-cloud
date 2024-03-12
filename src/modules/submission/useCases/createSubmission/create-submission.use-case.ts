import { UseCase } from '../../../shared/useCases';
import { SampleEntry, SubmissionFormInput } from '../../domain';
import { Submission } from '../../domain/submission.entity';

export abstract class CreateSubmissionUseCase
    implements UseCase<SubmissionFormInput, Submission<SampleEntry<string>[]>>
{
    constructor() {}

    abstract execute(
        params: SubmissionFormInput
    ): Promise<Submission<SampleEntry<string>[]>>;
}
