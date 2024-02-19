import { SubmissionFormInput } from '../../domain';
import { Submission } from '../../domain/submission.entity';
import { excelUnmarshalAntiCorruptionLayer } from '../../legacy';
import { CreateSubmissionUseCase } from './create-submission.use-case';

export class CreateSubmissionFromXLSXUseCase extends CreateSubmissionUseCase {
    async execute(params: SubmissionFormInput): Promise<Submission> {
        const file = new Parse.File(params.fileName, { base64: params.data });
        const buff = Buffer.from(await file.getData(), 'base64');
        const submission =
            await excelUnmarshalAntiCorruptionLayer.convertExcelToJSJson(
                buff,
                params.fileName
            );
        return submission;
    }
}
