import moment from 'moment';
import {
    ExcelFileInfo,
    SampleSet,
    SampleSheet,
    SampleSheetAnalysis,
    SampleSheetAnalysisOption,
    SampleSheetService
} from '../model/legacy.model';
import { JSONMarshalService } from './json-marshal.service';

export class SampleService {
    private readonly ENCODING = 'base64';
    private readonly DEFAULT_FILE_NAME = 'Einsendebogen';
    private readonly IMPORTED_FILE_EXTENSION = '.xlsx';

    constructor(
        private jsonMarshalService: JSONMarshalService,
        private sampleSheetService: SampleSheetService
    ) {}

    async convertToExcel(sampleSet: SampleSet): Promise<ExcelFileInfo> {
        const sampleSheet =
            await this.sampleSheetService.fromSampleSetToSampleSheet(sampleSet);

        this.prepareSampleSheetForExport(sampleSheet);

        const fileBuffer = await this.jsonMarshalService.createExcel(
            sampleSheet
        );

        const fileName = this.amendFileName(
            sampleSet.meta.fileName || this.DEFAULT_FILE_NAME,
            '.MP_' + moment().unix().toString(),
            fileBuffer.extension
        );

        return {
            data: fileBuffer.buffer.toString(this.ENCODING),
            fileName: fileName,
            type: fileBuffer.mimeType
        };
    }

    private prepareSampleSheetForExport(sampleSheet: SampleSheet): void {
        const keys: Exclude<
            keyof SampleSheetAnalysis,
            'compareHumanText' | 'otherText'
        >[] = [
            'species',
            'serological',
            'resistance',
            'vaccination',
            'molecularTyping',
            'toxin',
            'esblAmpCCarbapenemasen',
            'other',
            'compareHuman'
        ];

        const analysis = sampleSheet.meta.analysis;
        keys.forEach(key => {
            if (analysis[key] === SampleSheetAnalysisOption.STANDARD) {
                analysis[key] = SampleSheetAnalysisOption.ACTIVE;
            }
        });
    }

    private amendFileName(
        originalFileName: string,
        fileNameAddon: string,
        fileExtension: string
    ): string {
        const entries: string[] = originalFileName.split(
            this.IMPORTED_FILE_EXTENSION
        );
        let fileName: string = '';
        if (entries.length > 0) {
            fileName += entries[0];
        }
        fileName += fileNameAddon + fileExtension;
        fileName = fileName.replace(' ', '_');
        return fileName;
    }
}
