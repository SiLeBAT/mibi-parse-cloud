import { UseCase } from '../../../shared/useCases';
import { SubmissionFormInput } from '../../domain';
import { Submission } from './../../domain/submission.entity';

export abstract class CreateSubmissionUseCase
    implements UseCase<SubmissionFormInput, Submission>
{
    constructor() {}

    abstract execute(params: SubmissionFormInput): Promise<Submission>;
}
