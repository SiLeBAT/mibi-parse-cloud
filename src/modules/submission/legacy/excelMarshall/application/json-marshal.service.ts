import _ from 'lodash';
// @ts-expect-err: Weird legacy
import XlsxPopulate from 'xlsx-populate';

import {
    FORM_PROPERTIES,
    FORM_PROPERTIES_NRL,
    FileBuffer,
    FileRepository,
    META_ANALYSIS_COMPAREHUMAN_BOOL_CELL,
    META_ANALYSIS_COMPAREHUMAN_TEXT_CELL,
    META_ANALYSIS_ESBLAMPCCARBAPENEMASEN_CELL,
    META_ANALYSIS_MOLECULARTYPING_CELL,
    META_ANALYSIS_OTHER_TEXT_CELL,
    META_ANALYSIS_RESISTANCE_CELL,
    META_ANALYSIS_SEROLOGICAL_CELL,
    META_ANALYSIS_SPECIES_CELL,
    META_ANALYSIS_TOXIN_CELL,
    META_ANALYSIS_VACCINATION_CELL,
    META_ANAYLSIS_OTHER_BOOL_CELL,
    META_CUSTOMER_REF_NUMBER_CELL,
    META_NRL_CELL,
    META_SENDER_CONTACTPERSON_CELL,
    META_SENDER_DEPARTMENT_CELL,
    META_SENDER_EMAIL_CELL,
    META_SENDER_INSTITUTENAME_CELL,
    META_SENDER_STREET_CELL,
    META_SENDER_TELEPHONE_CELL,
    META_SENDER_ZIP_CITY_CELL,
    META_SIGNATURE_DATE_CELL,
    META_URGENCY_CELL,
    Sample,
    SampleSheet,
    SampleSheetAnalysisOption,
    SampleSheetConstants,
    SampleSheetMetaData,
    Urgency,
    VALID_SHEET_NAME,
    sampleSheetConfig,
    sampleSheetDefaultStyle,
    sampleSheetMetaStrings,
    sampleSheetNRLStrings,
    sampleSheetSamplesStrings,
    sampleSheetStyles
} from './../model/legacy.model';

type ChangedValueCollection = Record<string, string>;

export class JSONMarshalService {
    private readonly TEMPLATE_FILE_KEY = 'USER';
    private readonly TEMPLATE_FILE_KEY_NRL = 'NRL';
    private readonly FILE_EXTENSION = '.xlsx';
    private sampleSheetConstants: SampleSheetConstants = {
        config: sampleSheetConfig,
        defaultStyle: sampleSheetDefaultStyle,
        styles: sampleSheetStyles,
        metaStrings: sampleSheetMetaStrings,
        samplesStrings: sampleSheetSamplesStrings,
        nrlStrings: sampleSheetNRLStrings
    };
    constructor(private fileRepository: FileRepository) {}

    async createExcel(
        sampleSheet: SampleSheet,
        nrlSampleSheet: boolean = false
    ): Promise<FileBuffer> {
        const templateFileName = nrlSampleSheet
            ? this.TEMPLATE_FILE_KEY_NRL
            : this.TEMPLATE_FILE_KEY;

        const buffer = await this.fileRepository.getFileBuffer(
            templateFileName
        );

        if (!buffer) {
            throw new Error('No Excel data available.');
        }

        const highlights: Record<string, string>[] = [];
        sampleSheet.samples.forEach((sample: Sample) => {
            highlights.push(sample.getOldValues());
        });

        const dataToSave = this.fromDataObjToAOO(
            sampleSheet.samples,
            nrlSampleSheet
        );

        let workbook = await this.fromFileToWorkbook(buffer);

        workbook = this.addValidatedDataToWorkbook(
            workbook,
            dataToSave,
            highlights,
            nrlSampleSheet
        );

        workbook = this.addMetaDataToWorkbook(workbook, sampleSheet.meta);

        const workbookBuffer = await workbook.outputAsync();

        return {
            buffer: workbookBuffer,
            extension: this.FILE_EXTENSION,
            mimeType: XlsxPopulate.MIME_TYPE
        };
    }

    private async fromFileToWorkbook(buffer: Buffer) {
        const workbook = await XlsxPopulate.fromDataAsync(buffer);
        return workbook;
    }

    private fromDataObjToAOO(
        sampleCollection: Sample[],
        nrlSampleSheet: boolean = false
    ): string[][] {
        const dataToSave: string[][] = [];
        const formProperties: string[] = nrlSampleSheet
            ? [...FORM_PROPERTIES_NRL]
            : [...FORM_PROPERTIES];

        _.forEach(sampleCollection, (sample: Sample) => {
            const row: string[] = [];
            _.forEach(formProperties, header => {
                row.push(sample.getValueFor(header));
            });
            dataToSave.push(row);
        });

        return dataToSave;
    }

    private addMetaDataToWorkbook(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        workbook: any,
        meta: SampleSheetMetaData
    ) {
        const mapAnalysisOptionToString = (
            option: SampleSheetAnalysisOption
        ): string => {
            const strings =
                this.sampleSheetConstants.metaStrings.analysis.options;
            switch (option) {
                case SampleSheetAnalysisOption.OMIT:
                    return '';
                case SampleSheetAnalysisOption.ACTIVE:
                    return ' ' + strings.active;
                case SampleSheetAnalysisOption.STANDARD:
                    return ' ' + strings.standard;
            }
        };

        const sheet = workbook.sheet(VALID_SHEET_NAME);
        if (sheet) {
            sheet
                .cell(META_NRL_CELL)
                .value(this.sampleSheetConstants.nrlStrings[meta.nrl]);
            sheet
                .cell(META_URGENCY_CELL)
                .value(this.mapUrgencyEnumToString(meta.urgency));
            sheet
                .cell(META_SENDER_INSTITUTENAME_CELL)
                .value(meta.sender.instituteName);
            sheet
                .cell(META_SENDER_DEPARTMENT_CELL)
                .value(meta.sender.department);
            sheet.cell(META_SENDER_STREET_CELL).value(meta.sender.street);

            let place = '';
            const zip = meta.sender.zip;
            const city = meta.sender.city;
            if (zip !== '' && city !== '') {
                place = zip + ', ' + city;
            } else if (zip !== '') {
                place = zip;
            } else if (city !== '') {
                place = city;
            }
            sheet.cell(META_SENDER_ZIP_CITY_CELL).value(place);

            sheet
                .cell(META_SENDER_CONTACTPERSON_CELL)
                .value(meta.sender.contactPerson);
            sheet.cell(META_SENDER_TELEPHONE_CELL).value(meta.sender.telephone);
            sheet.cell(META_SENDER_EMAIL_CELL).value(meta.sender.email);
            sheet
                .cell(META_ANALYSIS_SPECIES_CELL)
                .value(mapAnalysisOptionToString(meta.analysis.species));
            sheet
                .cell(META_ANALYSIS_SEROLOGICAL_CELL)
                .value(mapAnalysisOptionToString(meta.analysis.serological));
            sheet
                .cell(META_ANALYSIS_RESISTANCE_CELL)
                .value(mapAnalysisOptionToString(meta.analysis.resistance));
            sheet
                .cell(META_ANALYSIS_VACCINATION_CELL)
                .value(mapAnalysisOptionToString(meta.analysis.vaccination));
            sheet
                .cell(META_ANALYSIS_MOLECULARTYPING_CELL)
                .value(
                    mapAnalysisOptionToString(meta.analysis.molecularTyping)
                );
            sheet
                .cell(META_ANALYSIS_TOXIN_CELL)
                .value(mapAnalysisOptionToString(meta.analysis.toxin));
            sheet
                .cell(META_ANALYSIS_ESBLAMPCCARBAPENEMASEN_CELL)
                .value(
                    mapAnalysisOptionToString(
                        meta.analysis.esblAmpCCarbapenemasen
                    )
                );
            sheet
                .cell(META_ANAYLSIS_OTHER_BOOL_CELL)
                .value(mapAnalysisOptionToString(meta.analysis.other));
            sheet
                .cell(META_ANALYSIS_OTHER_TEXT_CELL)
                .value(meta.analysis.otherText);
            sheet
                .cell(META_ANALYSIS_COMPAREHUMAN_BOOL_CELL)
                .value(mapAnalysisOptionToString(meta.analysis.compareHuman));
            sheet
                .cell(META_ANALYSIS_COMPAREHUMAN_TEXT_CELL)
                .value(meta.analysis.compareHumanText);
            sheet
                .cell(META_CUSTOMER_REF_NUMBER_CELL)
                .value(meta.customerRefNumber);
            sheet.cell(META_SIGNATURE_DATE_CELL).value(meta.signatureDate);
        }

        return workbook;
    }

    private mapUrgencyEnumToString(urgency: Urgency): string {
        switch (urgency) {
            case Urgency.URGENT:
                return 'EILT';
            case Urgency.NORMAL:
            default:
                return 'NORMAL';
        }
    }

    private addValidatedDataToWorkbook(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        workbook: any,
        dataToSave: string[][],
        highlights: ChangedValueCollection[] = [],
        nrlSampleSheet: boolean = false
    ) {
        const searchTerm = 'Ihre Probe-';
        const sheet = workbook.sheet(VALID_SHEET_NAME);
        const formProperties: string[] = nrlSampleSheet
            ? [...FORM_PROPERTIES_NRL]
            : [...FORM_PROPERTIES];

        if (sheet) {
            const startCol = 'A';
            const endCol = this.getColumnName(
                startCol.charCodeAt(0) - 64 + formProperties.length
            );
            const result = sheet.find(searchTerm);
            if (result.length > 0) {
                const cell = result[0];
                const rowNumber: number = cell.row().rowNumber();

                for (
                    let i = rowNumber + 1;
                    i <= rowNumber + dataToSave.length;
                    i++
                ) {
                    for (let j = 1; j <= formProperties.length; j++) {
                        const cell2 = sheet.row(i).cell(j);
                        cell2.value(undefined);
                    }
                }

                const startRow = rowNumber + 1;
                const startCell = startCol + startRow.toString();
                sheet.cell(startCell).value(dataToSave);

                if (!nrlSampleSheet) {
                    try {
                        const endCell =
                            endCol + (startRow + dataToSave.length).toString();
                        const rng = sheet.range(startCell + ':' + endCell);
                        rng.style({ fill: 'ffffff' });
                        this.highlightEdits(
                            sheet,
                            highlights,
                            startCol,
                            startRow
                        );
                    } catch (e) {
                        throw new Error('Unable to apply styling to Excel');
                    }
                }
            }
        }
        return workbook;
    }

    private getColumnName(numberOfColumns: number): string {
        let columnName = '';
        while (numberOfColumns > 0) {
            const modulo = (numberOfColumns - 1) % 26;
            columnName = String.fromCharCode(65 + modulo) + columnName;
            numberOfColumns = Math.floor((numberOfColumns - modulo) / 26);
        }
        return columnName;
    }

    // tslint:disable-next-line: no-any
    private highlightEdits(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sheet: any,
        highlights: ChangedValueCollection[],
        startCol: string,
        startRow: number
    ) {
        _.forEach(highlights, (row, index) => {
            if (!_.isEmpty(row)) {
                _.forEach(row, (v, k) => {
                    const col = _.findIndex(FORM_PROPERTIES, e => e === k);
                    if (col !== -1) {
                        const changedCol = String.fromCharCode(
                            startCol.charCodeAt(0) + col
                        );
                        sheet
                            .cell(changedCol + (startRow + index).toString())
                            .style({ fill: '0de5cf' });
                    }
                });
            }
        });
    }
}
