import { Order, SampleEntry, SubmissionFormInput } from '../../domain';
import { antiCorruptionLayers } from '../../legacy';
import { ParseSampleDataUseCase } from './parse-sample-data.use-case';

export class ParseFromXLSXUseCase extends ParseSampleDataUseCase {
    async execute(
        params: SubmissionFormInput
    ): Promise<Order<SampleEntry<string>[]>> {
        const file = new Parse.File(params.fileName, { base64: params.data });
        const buff = Buffer.from(await file.getData(), 'base64');
        const { excelUnmarshalAntiCorruptionLayer } =
            await antiCorruptionLayers;

        const submission =
            await excelUnmarshalAntiCorruptionLayer.convertExcelToJSJson(
                buff,
                params.fileName
            );
        return submission;
    }
}
