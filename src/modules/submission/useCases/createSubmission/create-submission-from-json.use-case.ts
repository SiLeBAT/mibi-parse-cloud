import { SampleEntry, SubmissionFormInput } from '../../domain';
import { Submission } from '../../domain/submission.entity';
import { OrderContainerDTO } from '../../dto';
import { SubmissionDTOMapper } from '../../mappers';
import { SampleEntryDTOMapper } from '../../mappers/sample-entry-dto.mapper';
import { CreateSubmissionUseCase } from './create-submission.use-case';

export class CreateSubmissionFromJSONUseCase extends CreateSubmissionUseCase {
    async execute(
        params: SubmissionFormInput
    ): Promise<Submission<SampleEntry<string>[]>> {
        const file = new Parse.File(params.fileName, { base64: params.data });
        const buff = Buffer.from(await file.getData(), 'base64');
        const jsonString = buff.toString('utf8');
        const dto: OrderContainerDTO = JSON.parse(jsonString);
        const submission = SubmissionDTOMapper.fromDTO(dto.order, samples => {
            return samples.map(s =>
                SampleEntryDTOMapper.fromDTO(s, t => t.value)
            );
        });
        return submission;
    }
}
