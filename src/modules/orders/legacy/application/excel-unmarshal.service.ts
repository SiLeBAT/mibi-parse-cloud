import moment from 'moment';
import 'moment/locale/de';
import { CellObject, read, utils, WorkBook, WorkSheet } from 'xlsx';

import { NRL_ID_VALUE, NRLId } from '../../../shared/domain/valueObjects';
import { nrlCache } from '../../../shared/infrastructure';
import {
    Address,
    Analysis,
    AnnotatedSampleDataEntry,
    DEFAULT_SAMPLE_DATA_HEADER_ROW,
    FORM_PROPERTIES,
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
    META_EXCEL_VERSION,
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
    SAMPLE_DATA_HEADER_ROW_MARKER,
    SampleData,
    SampleSheetAnalysis,
    SampleSheetAnalysisOption,
    SampleSheetMetaData,
    UnmarshalSample,
    UnmarshalSampleSheet,
    Urgency,
    VALID_SHEET_NAME
} from '../model/legacy.model';
import { NRLService } from './nrl.service';

export class ExcelUnmarshalService {
    constructor(private factory: SampleFactory) {}

    async convertExcelToJSJson(
        buffer: Buffer,
        fileName: string
    ): Promise<UnmarshalSampleSheet> {
        const workSheet: WorkSheet = await this.fromFileToWorkSheet(buffer);
        const samples = this.fromWorksheetToData(workSheet);

        const meta = this.getMetaDataFromFileData(workSheet, fileName);
        return {
            samples,
            meta
        };
    }

    private async fromFileToWorkSheet(buffer: Buffer): Promise<WorkSheet> {
        return new Promise<WorkSheet>((resolve, reject) => {
            const workbook: WorkBook = read(buffer, {
                type: 'buffer',
                cellDates: true, // write date as JS-Date to 'v' field, sets 't' field to 'd'
                cellText: true, // write formatted text to 'w' field
                cellStyles: false, // write style to 's' field
                cellNF: false // write number format string to 'z' field
            });
            const worksheetName: string = workbook.SheetNames[0];
            const workSheet: WorkSheet = workbook.Sheets[worksheetName];
            if (worksheetName === VALID_SHEET_NAME) {
                resolve(workSheet);
            } else {
                reject(
                    `Not a valid excel sheet, name of first sheet must be ${VALID_SHEET_NAME}`
                );
            }
        });
    }

    private getMetaDataFromFileData(
        workSheet: WorkSheet,
        fileName: string
    ): SampleSheetMetaData {
        return {
            nrl: this.getNRLFromWorkSheet(workSheet),
            urgency: this.getUrgencyFromWorkSheet(workSheet),
            sender: this.getSenderFromWorkSheet(workSheet),
            analysis: this.getAnalysisFromWorkSheet(workSheet),
            fileName,
            customerRefNumber: this.getStringFromCell(
                workSheet[META_CUSTOMER_REF_NUMBER_CELL]
            ),
            signatureDate: this.getStringFromCell(
                workSheet[META_SIGNATURE_DATE_CELL]
            ),
            version: this.getStringFromCell(
                workSheet[META_EXCEL_VERSION]
            ).substring(1)
        };
    }

    private getAnalysisFromWorkSheet(
        workSheet: WorkSheet
    ): SampleSheetAnalysis {
        const getOptionFromCell = (
            cell: CellObject
        ): SampleSheetAnalysisOption => {
            return this.getStringFromCell(cell) !== ''
                ? SampleSheetAnalysisOption.ACTIVE
                : SampleSheetAnalysisOption.OMIT;
        };

        return {
            species: getOptionFromCell(workSheet[META_ANALYSIS_SPECIES_CELL]),
            serological: getOptionFromCell(
                workSheet[META_ANALYSIS_SEROLOGICAL_CELL]
            ),
            resistance: getOptionFromCell(
                workSheet[META_ANALYSIS_RESISTANCE_CELL]
            ),
            vaccination: getOptionFromCell(
                workSheet[META_ANALYSIS_VACCINATION_CELL]
            ),
            molecularTyping: getOptionFromCell(
                workSheet[META_ANALYSIS_MOLECULARTYPING_CELL]
            ),
            toxin: getOptionFromCell(workSheet[META_ANALYSIS_TOXIN_CELL]),
            esblAmpCCarbapenemasen: getOptionFromCell(
                workSheet[META_ANALYSIS_ESBLAMPCCARBAPENEMASEN_CELL]
            ),
            other: getOptionFromCell(workSheet[META_ANAYLSIS_OTHER_BOOL_CELL]),
            otherText: this.getStringFromCell(
                workSheet[META_ANALYSIS_OTHER_TEXT_CELL]
            ),
            compareHuman: getOptionFromCell(
                workSheet[META_ANALYSIS_COMPAREHUMAN_BOOL_CELL]
            ),
            compareHumanText: this.getStringFromCell(
                workSheet[META_ANALYSIS_COMPAREHUMAN_TEXT_CELL]
            )
        };
    }

    private getSenderFromWorkSheet(workSheet: WorkSheet): Address {
        return {
            instituteName: this.getStringFromCell(
                workSheet[META_SENDER_INSTITUTENAME_CELL]
            ),
            department: this.getStringFromCell(
                workSheet[META_SENDER_DEPARTMENT_CELL]
            ),
            street: this.getStringFromCell(workSheet[META_SENDER_STREET_CELL]),
            zip: this.getStringFromCell(workSheet[META_SENDER_ZIP_CITY_CELL])
                .split(',')[0]
                .trim(),
            city: (
                this.getStringFromCell(workSheet[META_SENDER_ZIP_CITY_CELL]) +
                ','
            )
                .split(',')[1]
                .trim(),
            contactPerson: this.getStringFromCell(
                workSheet[META_SENDER_CONTACTPERSON_CELL]
            ),
            telephone: this.getStringFromCell(
                workSheet[META_SENDER_TELEPHONE_CELL]
            ),
            email: this.getStringFromCell(workSheet[META_SENDER_EMAIL_CELL])
        };
    }

    private getUrgencyFromWorkSheet(workSheet: WorkSheet): Urgency {
        const urgency = this.getStringFromCell(workSheet[META_URGENCY_CELL]);

        switch (urgency.toLowerCase()) {
            case 'eilt':
                return Urgency.URGENT;
            case 'normal':
            default:
                return Urgency.NORMAL;
        }
    }
    private getNRLFromWorkSheet(workSheet: WorkSheet): NRL_ID_VALUE {
        const workSheetNRL = this.getStringFromCell(workSheet[META_NRL_CELL]);
        return NRLId.create(workSheetNRL).value;
    }

    private getStringFromCell(cell: CellObject): string {
        if (!cell || cell.v === undefined) {
            return '';
        }
        switch (cell.t) {
            case 'b':
                return this.getStringFromBooleanCell(cell);
            case 'e':
                return this.getStringFromErrorCell(cell);
            case 'n':
                return this.getStringFromNumberCell(cell);
            case 'd':
                return this.getStringFromDateCell(cell);
            case 's':
                return (cell.v as string).trim();
            case 'z':
                return '';
        }
        return '';
    }

    private getStringFromBooleanCell(cell: CellObject): string {
        const v = cell.v as boolean;
        return v ? 'WAHR' : 'FALSCH';
    }

    private getStringFromErrorCell(cell: CellObject): string {
        // returns the english error strings
        return cell.w!;
    }

    private getStringFromNumberCell(cell: CellObject): string {
        const v = cell.v as number;
        // number cells are formatted with english rules
        // due to the complexity of convert all the rules to german, all user defined number formats are ignored
        return v.toString().replace('.', ',');
    }

    private getStringFromDateCell(cell: CellObject): string {
        const v = cell.v as Date;

        // date cells are formatted with english rules, so some conversion is necessary to get a german localized string
        // due to the complexity of this task all user defined date formats are ignored

        const localMoment = this.getLocalizedMomentFromDate(v);

        // to check if cell contains a time or a date reparse the cell to excel's serialized date format
        const serializedDate = utils.aoa_to_sheet([[v]], { cellDates: false })[
            'A1'
        ].v as number;

        // excel uses integer part for dates and fractional part for time
        const isTime = serializedDate - Math.floor(serializedDate) !== 0;
        const isDate = serializedDate >= 1;

        // format the date accordingly
        if (isDate && !isTime) {
            return localMoment.format('L');
        } else if (!isDate) {
            return localMoment.format('LTS');
        } else {
            return localMoment.format('L LTS');
        }
    }

    private getLocalizedMomentFromDate(date: Date): moment.Moment {
        // moment does not interpret timezones so some trickery is necessary

        // create moment with given timezone offset
        const offMoment = moment(date);

        // get timezone offset of local server timezone
        const localOffset = moment().utcOffset();

        // convert to utc time with offset to local server timezone
        let correctMoment = offMoment.utcOffset(localOffset);
        correctMoment = this.correctMomentForXLSXSummerTimeBug(
            correctMoment,
            date
        );

        return correctMoment.locale('de');
    }

    private correctMomentForXLSXSummerTimeBug(
        momentDate: moment.Moment,
        date: Date
    ): moment.Moment {
        // since xlsx v0.16.0 date is in summer time if the date itself lies in summer, instead of local server time is in summer

        const localOffset = moment().utcOffset();

        const gmtString = date.toString();
        const gmtIndex = gmtString.indexOf('GMT');
        const hours = Number(gmtString.substr(gmtIndex + 4, 2));
        const minutes = Number(gmtString.substr(gmtIndex + 6, 2));
        let parsedOffset = hours * 60 + minutes;
        if (gmtString.substr(gmtIndex + 3, 1) === '-') {
            parsedOffset = -parsedOffset;
        }

        return momentDate.add(parsedOffset - localOffset, 'minutes');
    }

    private fromWorksheetToData(workSheet: WorkSheet): UnmarshalSample[] {
        const lineNumber = this.getSampleDataHeaderRow(workSheet);

        const data = utils.sheet_to_json<Record<string, string>>(workSheet, {
            header: FORM_PROPERTIES,
            range: lineNumber,
            defval: ''
        });

        const cleanedData = this.fromDataToCleanedSamples(data);

        const formattedData: UnmarshalSample[] = this.formatData(cleanedData);

        return formattedData;
    }

    private formatData(data: Record<string, string>[]): UnmarshalSample[] {
        const formattedData = data.map((sample: Record<string, string>) => {
            const annotatedSampleData: Record<
                string,
                AnnotatedSampleDataEntry
            > = {};

            for (const props in sample) {
                if (this.isDateField(props)) {
                    sample[props] = this.parseDate(sample[props]);
                }
                annotatedSampleData[props] = this.createAnnotatedSampleEntry(
                    sample[props]
                );
            }

            return this.factory.createSample(annotatedSampleData as SampleData);
        });
        return formattedData;
    }

    private createAnnotatedSampleEntry(
        value: string
    ): AnnotatedSampleDataEntry {
        return {
            value,
            errors: [],
            correctionOffer: []
        };
    }

    private parseDate(stringOrDate: string | Date) {
        const date = stringOrDate.toString();
        try {
            let parsedMoment: moment.Moment;

            // date was given as Date object
            if (date.includes('GMT')) {
                parsedMoment = this.getLocalizedMomentFromDate(new Date(date));
                // date was given as string
            } else {
                const americanDF = /\d\d?\/\d\d?\/\d\d\d?\d?/;
                let dateFormat: string;
                if (americanDF.test(date)) {
                    dateFormat = 'MM/DD/YYYY';
                } else {
                    dateFormat = 'DD.MM.YYYY';
                }
                parsedMoment = moment(date, dateFormat).locale('de');
            }

            if (!parsedMoment.isValid()) {
                return date;
            }
            return parsedMoment.format('DD.MM.YYYY');
        } catch (e) {
            return date;
        }
    }

    private isDateField(field: string) {
        switch (field) {
            case 'sampling_date':
            case 'isolation_date':
                return true;
            default:
                return false;
        }
    }

    private getSampleDataHeaderRow(workSheet: WorkSheet): number {
        for (const key in workSheet) {
            if (workSheet[key].v === SAMPLE_DATA_HEADER_ROW_MARKER) {
                const row = utils.encode_row(utils.decode_cell(key).r);
                return parseInt(row, 10);
            }
        }
        return DEFAULT_SAMPLE_DATA_HEADER_ROW;
    }

    private fromDataToCleanedSamples(
        data: Record<string, string>[]
    ): Record<string, string>[] {
        const cleanedData: Record<string, string>[] = data.filter(
            sampleObj =>
                Object.keys(sampleObj)
                    .map(key => sampleObj[key])
                    .filter(item => item !== '').length > 0
        );

        return cleanedData;
    }
}

class SampleFactory {
    constructor(private nrlService: NRLService) {}
    createSample(data: SampleData): UnmarshalSample {
        const pathogen = data['pathogen_avv'].value;

        const nrl = this.nrlService.getNRLForPathogen(pathogen);
        const defaultAnalysis: Partial<Analysis> = {
            ...this.nrlService.getStandardAnalysisFor(nrl),
            ...this.nrlService.getOptionalAnalysisFor(nrl)
        };

        return UnmarshalSample.create(data, {
            nrl,
            analysis: defaultAnalysis,
            urgency: Urgency.NORMAL
        });
    }
}

const nrlService = new NRLService(nrlCache);
const sampleFactory = new SampleFactory(nrlService);
const excelUnmarshalService = new ExcelUnmarshalService(sampleFactory);

export { excelUnmarshalService };
