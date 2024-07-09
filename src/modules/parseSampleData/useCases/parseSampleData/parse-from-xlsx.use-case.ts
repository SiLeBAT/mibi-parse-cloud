import { SampleEntry, SubmissionFormInput } from '../../domain';
import { Submission } from '../../domain/submission.entity';
import { excelUnmarshalAntiCorruptionLayer } from '../../legacy';
import { ParseSampleDataUseCase } from './parse-sample-data.use-case';

export class ParseFromXLSXUseCase extends ParseSampleDataUseCase {
    async execute(
        params: SubmissionFormInput
    ): Promise<Submission<SampleEntry<string>[]>> {
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
