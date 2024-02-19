import { SubmissionDTOMapper } from '../../mappers';
import { SubmissionFormInput } from '../../domain';
import { Submission } from '../../domain/submission-b.entity';
import { OrderContainerDTO } from './create-submission.dto';
import { CreateSubmissionUseCase } from './create-submission.use-case';

export class CreateSubmissionFromJSONUseCase extends CreateSubmissionUseCase {
    async execute(params: SubmissionFormInput): Promise<Submission> {
        const file = new Parse.File(params.fileName, { base64: params.data });
        const buff = Buffer.from(await file.getData(), 'base64');
        const jsonString = buff.toString('utf8');
        const dto: OrderContainerDTO = JSON.parse(jsonString);
        const submission = SubmissionDTOMapper.fromDTO(dto.order);
        return submission;
    }
}
