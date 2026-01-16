import { ExcelUnmarshalService } from '../application/excel-unmarshal.service';
import { SampleSheetService } from '../application/sample-sheet.service';
import { UnmarshalSampleSheet } from '../model/legacy.model';
import { legacyConverterFactory } from './legacy-to-order-converter';

export class ExcelUnmarshalAntiCorruptionLayer {
    constructor(
        private excelUnmarshalService: ExcelUnmarshalService,
        private sampleSheetService: SampleSheetService
    ) {}

    async convertExcelToJSJson(buffer: Buffer, fileName: string) {
        const legacySampleSheet: UnmarshalSampleSheet =
            await this.excelUnmarshalService.convertExcelToJSJson(
                buffer,
                fileName
            );

        const legacySampleSet =
            this.sampleSheetService.fromSampleSheetToSampleSet(
                legacySampleSheet
            );

        const excelVersion = legacySampleSet.meta.version || '18';
        const converter =
            legacyConverterFactory.getLegacyConverter(excelVersion);
        const order = await converter.convertFromLegacy(legacySampleSet);

        return order;
    }
}
