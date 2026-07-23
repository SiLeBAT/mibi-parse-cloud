import {
    Order,
    SampleEntry,
    SampleEntryTuple,
    SubmissionFormInput
} from '../../domain';
import { antiCorruptionLayers } from '../../legacy';
import { ParsedSampleSheetInput } from '../../legacy/application/excel-unmarshal.service';
import { ParseSampleDataUseCase } from './parse-sample-data.use-case';

/**
 * MPS-312: the client parses the .xlsx into JSON in the browser and sends that JSON.
 * This use case decodes it and runs the server-side NRL enrichment, replacing the
 * old flow where a raw excel file was uploaded and parsed on the server.
 */
export class ParseFromParsedSheetUseCase extends ParseSampleDataUseCase {
    async execute(
        params: SubmissionFormInput
    ): Promise<Order<SampleEntry<SampleEntryTuple>[]>> {
        const file = new Parse.File(params.fileName, { base64: params.data });
        const buff = Buffer.from(await file.getData(), 'base64');
        const jsonString = buff.toString('utf8');
        const parsedSheet: ParsedSampleSheetInput = JSON.parse(jsonString);

        const { excelUnmarshalAntiCorruptionLayer } =
            await antiCorruptionLayers;
        return excelUnmarshalAntiCorruptionLayer.convertParsedSheetToOrder(
            parsedSheet
        );
    }
}
