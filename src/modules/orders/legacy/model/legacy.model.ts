import _ from 'lodash';

import { NRL_ID_VALUE } from '../../../shared/domain/valueObjects';
import { ReceiveAs } from '../../domain/enums';
import { CatalogService } from '../application/catalog.service';
import { sampleSheetPDFConfig } from './sample-sheet-pdf.config';
import { sampleSheetPDFStyles } from './sample-sheet-pdf.styles';
import { Sample } from './sample.entity';
import { NRLService } from '../application/nrl.service';
export enum SampleSheetAnalysisOption {
    OMIT,
    ACTIVE,
    STANDARD
}
export interface SampleSheetMetaData {
    nrl: NRL_ID_VALUE;
    sender: Address;
    analysis: SampleSheetAnalysis;
    urgency: Urgency;
    fileName: string;
    customerRefNumber: string;
    signatureDate: string;
    version: string;
}

export interface CorrectionSuggestions {
    field: SampleProperty;
    original: string;
    correctionOffer: string[];
    code: number;
}

export interface CorrectionFunction {
    (sampleData: SampleData): CorrectionSuggestions | null;
}

export interface SearchAlias {
    catalog: string;
    token: string;
    alias: string[];
}
export interface CatalogEnhancement {
    alias: string;
    text: string;
}
export interface ResultOptions {
    alias?: string;
    original: string;
    numberOfResults: number;
    property: SampleProperty;
}

export interface Analysis {
    species: boolean;
    serological: boolean;
    resistance: boolean;
    vaccination: boolean;
    molecularTyping: boolean;
    toxin: boolean;
    esblAmpCCarbapenemasen: boolean;
    sample: boolean;
    other: string;
    compareHuman: {
        value: string;
        active: boolean;
    };
}
export const EMPTY_ANALYSIS: Analysis = {
    species: false,
    serological: false,
    resistance: false,
    vaccination: false,
    molecularTyping: false,
    toxin: false,
    esblAmpCCarbapenemasen: false,
    sample: false,
    other: '',
    compareHuman: {
        value: '',
        active: false
    }
};
export const sampleSheetMetaStrings = {
    header: {
        title: 'Untersuchungsauftrag für Isolate/Proben',
        titleSup: 'a,b',
        subtitle:
            'Erläuterungen zum Ausfüllen dieses Formulars befinden sich im zweiten Tabellenblatt dieser Datei',
        version: 'Version V'
    },
    recipient: {
        title: 'Empfänger',
        institute: 'Bundesinstitut für Risikobewertung',
        street: 'Diedersdorfer Weg 1',
        place: 'D-12277 Berlin',
        nrl: 'Labor'
    },
    stamp: {
        receiptDate: 'Eingangsdatum beim BfR',
        customerRefNumber: 'Aktenzeichen des Einsenders'
    },
    sender: {
        title: 'Einsender',
        instituteName: 'Institut',
        department: 'Abteilung',
        street: 'Strasse',
        place: 'PLZ, Ort',
        contactPerson: 'Ansprechpartner',
        telephone: 'Telefon-Nr.',
        email: 'Email-Adresse'
    },
    signature: {
        date: 'Ort, Datum',
        dataProcessingText: 'Informationen zur Datenverarbeitung: Siehe ',
        dataProcessingLink:
            'https://www.bfr.bund.de/de/datenschutzerklaerung-107546.html',
        dataProcessingHintPre:
            'Bitte beachten Sie die allgemeinen Bedingungen für den Austausch von Materialien – Vergabe an das BfR (Material Transfer-Bedingungen – Teil B (',
        dataProcessingHintLink:
            'https://www.bfr.bund.de/cm/343/mt-bedingungen-teil-b.pdf',
        dataProcessingHintPost: ')',
        signature: 'Unterschrift'
    },
    analysis: {
        title: 'Bitte führen Sie folgende Untersuchungen der Isolate durch',
        titleSup: 'c',
        options: {
            standard: 'Standard',
            active: 'X'
        },
        species:
            'Speziesbestimmung/-differenzierung (bzw. Bestätigung der Differenzierung)',
        serological: 'Serologische Differenzierung',
        resistance: 'Resistenzermittlung',
        vaccination: 'Impfstammidentifikation',
        molecularTyping: 'Weitergehende molekularbiologische Feintypisierung',
        molecularTypingSup: 'd',
        toxin: 'Prüfung auf Toxine bzw. Virulenzeigenschaften',
        esblAmpCCarbapenemasen: 'ESBL/AmpC/Carbapenemasen',
        other: 'sonstiges (nach Absprache):',
        compareHuman: 'Vergleiche mit humanen Isolaten',
        compareHumanSup: 'e'
    },
    urgency: {
        title: 'Dringlichkeit:'
    },
    instructions: {
        sendInstructionsPre:
            'Bitte lassen Sie diesen Untersuchungsauftrag durch das MiBi-Portal (',
        sendInstructionsLink: 'https://mibi-portal.bfr.bund.de',
        sendInstructionsPost:
            ') prüfen und senden Sie die Probendaten über die dort vorhandene Senden-Funktion an das BfR.',
        printInstructions:
            'Sie erhalten die geprüften Untersuchungsaufträge vom Portal per E-Mail. Drucken Sie diese bitte aus und legen Sie diese unterschrieben den Proben als Begleitschein bei.',
        cellProtectionInstruction1:
            'Felder im Einsendebogen sind ohne Schreibschutz zur erleichterten Nutzung/Einbindung in unterschiedliche Laborinformationsmanagement-Systeme. Änderungen von Zellinhalten außerhalb der Ausfüllfelder',
        cellProtectionInstruction2:
            'sind nicht zielführend und werden beim Einlesen der Daten durch das BfR nicht berücksichtigt.'
    },
    footer: {
        validated:
            'OE-Mibi-SOP-059_FB_A01_Elektronischer Einsendebogen_V17 gültig ab 01.01.2024',
        page: 'Seite',
        pageOf: 'von'
    }
};

export const sampleSheetSamplesStrings = {
    titles: {
        sample_id: 'Ihre Probe-nummer',
        sample_id_avv: 'Probe-nummer nach AVV Data',
        partial_sample_id: 'AVV DatA-Teil-pro-ben-Nr.',
        pathogen_avv: 'Erreger',
        pathogen_text: 'Erreger',
        sampling_date: 'Datum der Probe-nahme',
        isolation_date: 'Datum der Isolierung',
        sampling_location_zip: 'Ort der Probe-nahme',
        sampling_location_text: 'Ort der Probe-nahme',
        animal_matrix_text: 'Tiere / Matrix',
        primary_production_text_avv: 'Angaben zur Primär-produktion',
        program_reason_text: 'Kontrollprogramm / Untersuchungsgrund',
        operations_mode_text: 'Betriebsart',
        vvvo: 'VVVO-Nr / Herde',
        program_text_avv: 'Programm',
        comment: 'Bemerkung'
    },
    subtitles: {
        sample_id: '',
        sample_id_avv: '',
        partial_sample_id: '',
        pathogen_avv: '(Text aus AVV DatA-Kat-Nr. 324)',
        pathogen_text: '(Text)',
        sampling_date: '',
        isolation_date: '',
        sampling_location_zip: '(PLZ)',
        sampling_location_text: '(Text)',
        animal_matrix_text: '(Text)',
        primary_production_text_avv: '(Text aus AVV DatA-Kat-Nr. 316)',
        program_reason_text: '(Text)',
        operations_mode_text: '(Text)',
        vvvo: '',
        program_text_avv: '(Text aus AVV DatA-Kat-Nr. 328)',
        comment: ''
    }
};

export const sampleSheetNRLStrings: Record<NRL_ID_VALUE, string> = {
    'NRL-AR': 'NRL für Antibiotikaresistenz',
    'NRL-Campy': 'NRL für Campylobacter',
    'NRL-VTEC':
        'NRL für Escherichia coli einschließl. verotoxinbildende E. coli',
    'NRL-Staph':
        'NRL für koagulasepositive Staphylokokken einschl. Staphylococcus aureus',
    'NRL-Listeria': 'NRL für Listeria monocytogenes',
    'NRL-Salm': 'NRL für Salmonella',
    'KL-Vibrio': 'Konsiliarlabor für Vibrionen',
    'L-Bacillus': 'Labor für Sporenbildner, Bacillus spp.',
    'L-Clostridium': 'Labor für Sporenbildner, Clostridium spp.',
    'KL-Yersinia': 'Konsiliarlabor für Yersinia',
    'Labor nicht erkannt': ''
};
export const sampleSheetConfig = {
    version: 17,
    svgLogoPath: './assets/BfR_Logo_de_RGB_pdf.svg',
    page: {
        size: 'A4',
        orientation: 'landscape',
        margins: {
            left: 22,
            top: 16,
            right: 9,
            bottom: 19
        }
    },
    footer: {
        margins: {
            left: 22,
            top: 3,
            right: 9,
            bottom: 0
        }
    },
    fileInfo: {
        title: 'Untersuchungsauftrag für Isolate/Proben',
        author: 'BfR',
        creator: 'MiBi-Portal'
    }
};
export const sampleSheetDefaultStyle = {
    font: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.6
};

export const sampleSheetStyles = {
    // meta
    title: {
        fontSize: 14,
        bold: true
    },
    version: {
        fontSize: 12,
        bold: true
    },
    comment: {
        fontSize: 10
    },
    heading1: {
        fontSize: 12,
        decoration: 'underline',
        bold: true
    },
    heading2: {
        fontSize: 10,
        decoration: 'underline',
        bold: true
    },
    heading3: {
        fontSize: 10,
        bold: true
    },
    elevated: {
        bold: true
    },
    cell: {
        lineHeight: 1.2
    },
    markedCell: {
        fillColor: '#FFFF99'
    },
    link: {
        color: '#0000FF',
        decoration: 'underline'
    },
    userComment: {
        italics: true
    },
    doubleRow: {
        lineHeight: 2.4
    },
    halfLine: {
        lineHeight: 0.8
    },

    // samples

    headerCell: {
        lineHeight: 1.2,
        // fontSize: 10,
        fontSize: 9.5,
        bold: true,
        fillColor: '#99CCFF'
    },
    subHeader: {
        fontSize: 8,
        bold: false
    },
    dataCell: {
        lineHeight: 1.2,
        fontSize: 9
    },
    editedCell: {
        fillColor: '#0DE5CF'
    },

    // footer

    footer: {
        fontSize: 10
    }
};

export interface FileRepository {
    getFileBuffer(fileName: string): Promise<Buffer>;
}
export type SampleSheetConfig = typeof sampleSheetConfig;
export type SampleSheetMetaStrings = typeof sampleSheetMetaStrings;
export type SampleSheetSamplesStrings = typeof sampleSheetSamplesStrings;
export type SampleSheetNRLStrings = typeof sampleSheetNRLStrings;

export const sampleSheetConstants: SampleSheetConstants = {
    config: sampleSheetConfig,
    defaultStyle: sampleSheetDefaultStyle,
    styles: sampleSheetStyles,
    metaStrings: sampleSheetMetaStrings,
    samplesStrings: sampleSheetSamplesStrings,
    nrlStrings: sampleSheetNRLStrings
};

export type SampleSheetPDFConfig = typeof sampleSheetPDFConfig;

export interface PDFConstants {
    readonly config: SampleSheetPDFConfig;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly styles: any;
}
export const pdfConstants: PDFConstants = {
    config: sampleSheetPDFConfig,
    styles: sampleSheetPDFStyles
};
export interface SampleSheetConstants {
    readonly config: SampleSheetConfig;
    // eslint-disable-next-line @typescript-eslint/ban-types
    readonly defaultStyle: {};
    // eslint-disable-next-line @typescript-eslint/ban-types
    readonly styles: {};
    readonly metaStrings: SampleSheetMetaStrings;
    readonly samplesStrings: SampleSheetSamplesStrings;
    readonly nrlStrings: SampleSheetNRLStrings;
}

export interface SearchAlias {
    catalog: string;
    token: string;
    alias: string[];
}

export interface State {
    name: string;
    short: string;
    AVV: string[];
}

export interface AVVCatalogObject {
    catalogCode: string;
    version: string;
    validFrom: Date;
    catalogData: string;
}

export interface AVVFormatCollection {
    [key: string]: string[];
}

export interface SampleSheetAnalysis {
    species: SampleSheetAnalysisOption;
    serological: SampleSheetAnalysisOption;
    resistance: SampleSheetAnalysisOption;
    vaccination: SampleSheetAnalysisOption;
    molecularTyping: SampleSheetAnalysisOption;
    toxin: SampleSheetAnalysisOption;
    esblAmpCCarbapenemasen: SampleSheetAnalysisOption;
    other: SampleSheetAnalysisOption;
    otherText: string;
    compareHuman: SampleSheetAnalysisOption;
    compareHumanText: string;
}

export interface ValidatorConfig {
    dateFormat: string;
    dateTimeFormat: string;
    catalogService: CatalogService;
}

export interface Validator {
    validateSample(
        sample: Sample,
        constraintSet: ValidationConstraints
    ): ValidationErrorCollection;
}

export type EditValue = string;
export type SampleProperty = keyof SampleData;
export interface SampleMetaData {
    nrl: NRL_ID_VALUE;
    urgency: Urgency;
    analysis: Partial<Analysis>;
}

export interface UnmarshalSampleSheet {
    samples: UnmarshalSample[];
    meta: SampleSheetMetaData;
}

export interface UnmarshalSampleSet {
    samples: UnmarshalSample[];
    meta: SampleSetMetaData;
}

export class UnmarshalSample {
    static create(data: SampleData, meta: SampleMetaData): UnmarshalSample {
        const cleanedData = _.cloneDeep(data);
        _.forEach(cleanedData, (v, k) => {
            cleanedData[k].value = ('' + v.value).trim();
        });

        return new UnmarshalSample(cleanedData, meta);
    }

    private constructor(
        private _data: SampleData,
        private _meta: SampleMetaData
    ) {}

    toString() {
        return 'Sample ' + this._data.sample_id + ' for ' + this._meta.nrl;
    }

    get data() {
        return this._data;
    }
    get meta() {
        return this._meta;
    }

    getNRL(): NRL_ID_VALUE {
        return this._meta.nrl;
    }

    setAnalysis(nrlService: NRLService, analysis: Partial<Analysis>): void {
        this._meta.analysis = {
            ..._.cloneDeep(analysis),
            ...nrlService.getStandardAnalysisFor(this._meta.nrl)
        };
    }

    setUrgency(urgency: Urgency): void {
        this._meta.urgency = urgency;
    }
}

export interface SampleDataEntry {
    value: string;
    oldValue?: string;
}

export interface AnnotatedSampleDataEntry extends SampleDataEntry {
    errors: SampleValidationError[];
    correctionOffer: string[];
    nrlData?: string;
}

interface SampleValidationError {
    code: number;
    level: number;
    message: string;
}

export interface SampleData {
    sample_id: AnnotatedSampleDataEntry;
    sample_id_avv: AnnotatedSampleDataEntry;
    partial_sample_id: AnnotatedSampleDataEntry;
    pathogen_avv: AnnotatedSampleDataEntry;
    pathogen_text: AnnotatedSampleDataEntry;
    sampling_date: AnnotatedSampleDataEntry;
    isolation_date: AnnotatedSampleDataEntry;
    sampling_location_avv: AnnotatedSampleDataEntry;
    sampling_location_zip: AnnotatedSampleDataEntry;
    sampling_location_text: AnnotatedSampleDataEntry;
    animal_avv: AnnotatedSampleDataEntry;
    matrix_avv: AnnotatedSampleDataEntry;
    animal_matrix_text: AnnotatedSampleDataEntry;
    primary_production_avv: AnnotatedSampleDataEntry;
    control_program_avv: AnnotatedSampleDataEntry;
    sampling_reason_avv: AnnotatedSampleDataEntry;
    program_reason_text: AnnotatedSampleDataEntry;
    operations_mode_avv: AnnotatedSampleDataEntry;
    operations_mode_text: AnnotatedSampleDataEntry;
    vvvo: AnnotatedSampleDataEntry;
    program_avv: AnnotatedSampleDataEntry;
    comment: AnnotatedSampleDataEntry;
    [key: string]: AnnotatedSampleDataEntry;
}

export type AVVCatalogData =
    | MibiCatalogData
    | MibiCatalogFacettenData
    | AVV324Data;

export interface AVV313Eintrag extends MibiEintrag {
    PLZ: string;
    Name: string;
}

export interface MibiFacettenEintrag extends MibiEintrag {
    FacettenIds: number[];
    Facettenzuordnungen?: MibiFacettenzuordnung[];
    Attribute?: string;
}

export interface MibiFacettenzuordnung {
    FacettenId: number;
    FacettenwertId: number;
    Festgelegt: boolean;
}

interface MibiFacetten {
    [key: string]: MibiFacette;
}

export interface MibiCatalogFacettenData extends MibiCatalogData {
    facetten: MibiFacetten;
    facettenIds?: MibiFacettenIds;
}

export interface MibiFacettenIds {
    [key: string]: MibiFacettenId;
}

export interface MibiFacettenId {
    [key: string]: MibiFacettenWertId;
}

export interface MibiFacettenWertId {
    FacettenNameBegriffsId: number;
    WertNameBegriffsId: number;
}

export interface MibiFacette {
    FacettenId: number;
    MehrfachAuswahl: boolean;
    Text: string;
    FacettenWerte: MibiFacettenWerte;
}

interface MibiFacettenWerte {
    [key: string]: MibiFacettenWert;
}

export interface MibiFacettenWert {
    Text: string;
}
export interface MibiEintrag {
    Text: string;
    Basiseintrag: boolean;
}
interface MibiEintraege {
    [key: string]: MibiEintrag | AVV313Eintrag | MibiFacettenEintrag;
}

interface AVV324Eintraege {
    [key: string]: string;
}

export interface MibiCatalogData {
    version: string;
    gueltigAb: string;
    katalogNummer: string;
    katalogName: string;
    facettenErlaubt: boolean;
    eintraege: MibiEintraege;
}

export interface ADVCatalogEntry {
    Kode: string;
    Text: string;
    Kodiersystem: string;
}

export interface AVV324Data extends MibiCatalogData {
    textEintraege: AVV324Eintraege;
    fuzzyEintraege: FuzzyEintrag[];
}

export interface FuzzyEintrag extends MibiEintrag {
    Kode: string;
}

export interface SampleSheet {
    samples: Sample[];
    meta: SampleSheetMetaData;
}

export type CatalogData =
    | Record<string, string>
    | ADVCatalogEntry
    | ZSPCatalogEntry;

export type SampleDataValues = Record<SampleProperty, string>;
export type SampleDataEntries = Record<SampleProperty, SampleDataEntry>;

export interface ValidatorFunction<T extends ValidatorFunctionOptions> {
    (
        value: string,
        options: T,
        key: SampleProperty,
        attributes: SampleDataValues
    ): ValidationError | null;
}

export interface ValidationErrorCollection {
    [key: string]: ValidationError[];
}

export interface ValidationError {
    code: number;
    level: number;
    message: string;
    correctionOffer?: string[];
}

export interface AtLeastOneOfOptions extends ValidatorFunctionOptions {
    additionalMembers: SampleProperty[];
}

export interface DependentFieldsOptions extends ValidatorFunctionOptions {
    dependents: SampleProperty[];
}

export interface ReferenceDateOptions extends ValidatorFunctionOptions {
    earliest?: SampleProperty | string;
    latest?: SampleProperty | string;
    modifier?: {
        value: number;
        unit: 'year';
    };
}

interface Group {
    code: keyof ZSPCatalogEntry;
    attr: SampleProperty;
}

export interface RegisteredZoMoOptions extends ValidatorFunctionOptions {
    year: string[];
    group: Group[];
    catalog: string;
}
export interface ValidatorFunctionOptions {
    message: ValidationError;
}
export interface MatchIdToYearOptions extends ValidatorFunctionOptions {
    regex: string[];
}

export interface MatchRegexPatternOptions extends MatchIdToYearOptions {
    ignoreNumbers: boolean;
    caseInsensitive?: boolean;
}

export interface RequiredIfOtherOptions extends ValidatorFunctionOptions {
    regex: string;
    field: SampleProperty;
}

export interface InCatalogOptions extends ValidatorFunctionOptions {
    catalog: string;
    key: string;
}

export interface MatchADVNumberOrStringOptions extends InCatalogOptions {
    alternateKeys: string[];
}

export interface MatchAVVCodeOrStringOptions extends InCatalogOptions {
    alternateKey: string;
}

export const ZOMO_ID = {
    code: '70564|53075|',
    string1: 'zoonose',
    string2: 'monitoring'
};

export interface ValidationRule {
    error: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export interface ValidationRuleSet {
    [key: string]: ValidationRule;
}

export interface ValidationConstraints {
    [key: string]: ValidationRuleSet;
}

export interface ZSPCatalogEntry {
    'ADV8-Kode': string[];
    Kodiersystem: string[];
    'ADV3-Kode': string[];
    'ADV16-Kode': string[];
}
export interface Attachment {
    filename: string;
    content: Buffer;
    contentType: string;
}
interface RecipientInfo {
    name: string;
    email: string;
}

interface BaseDatasetNotificationPayload {
    appName: string;
    comment: string;
}
interface NrlDataFeatureProperties {
    catalog: string;
    avvProperty: string;
}

export interface NrlDataFeatures {
    [key: string]: NrlDataFeatureProperties;
}
export enum NotificationType {
    REQUEST_ACTIVATION,
    REQUEST_ALTERNATIVE_CONTACT,
    REQUEST_RESET,
    RESET_SUCCESS,
    REQUEST_JOB,
    REQUEST_ADMIN_ACTIVATION,
    NOTIFICATION_ADMIN_ACTIVATION,
    NOTIFICATION_NOT_ADMIN_ACTIVATED,
    NOTIFICATION_ALREADY_REGISTERED,
    REMINDER_ADMIN_ACTIVATION,
    NOTIFICATION_SENT
}
export interface NotificationMeta {}

export interface Notification<T, V extends NotificationMeta> {
    type: NotificationType;
    payload?: T;
    meta?: V;
}

export interface EmailNotificationMeta extends NotificationMeta {
    to: string;
    cc: string[];
    subject: string;
    attachments: Attachment[];
}
export interface EmailNotification<T, V extends EmailNotificationMeta>
    extends Notification<T, V> {
    meta: V;
}
export interface NewDatasetNotificationPayload
    extends BaseDatasetNotificationPayload {
    firstName: string;
    lastName: string;
    email: string;
    institution: Institute;
}
export interface OrderNotificationMetaData extends ApplicantMetaData {
    recipient: RecipientInfo;
}
export interface NewDatasetCopyNotificationPayload
    extends BaseDatasetNotificationPayload {
    name: string;
}

export interface OrderNotificationMetaData extends ApplicantMetaData {
    recipient: RecipientInfo;
}
export interface NrlSampleData extends SampleData {
    sampling_location_text_avv: AnnotatedSampleDataEntry;
    animal_text_avv: AnnotatedSampleDataEntry;
    matrix_text_avv: AnnotatedSampleDataEntry;
    primary_production_text_avv: AnnotatedSampleDataEntry;
    control_program_text_avv: AnnotatedSampleDataEntry;
    sampling_reason_text_avv: AnnotatedSampleDataEntry;
    operations_mode_text_avv: AnnotatedSampleDataEntry;
    program_text_avv: AnnotatedSampleDataEntry;
}
interface SampleSetMetaData {
    sender: Address;
    fileName: string;
    customerRefNumber: string;
    signatureDate: string;
    version: string;
}
export interface SampleSet {
    samples: Sample[];
    meta: SampleSetMetaData;
}
export interface Institute {
    stateShort: string;
    name: string;
    city: string;
    zip: string;
}
export interface User {
    firstName: string;
    lastName: string;
    email: string;
    institution: Institute;
    getFullName(): string;
}
export interface ApplicantMetaData {
    user: User;
    comment: string;
    receiveAs: ReceiveAs;
}
export interface Payload {
    buffer: Buffer;
    fileName: string;
    mime: string;
    nrl: NRL_ID_VALUE;
}

export interface ExcelFileInfo {
    data: string;
    fileName: string;
    type: string;
}
export enum Urgency {
    NORMAL = 'NORMAL',
    URGENT = 'EILT'
}

export interface EmailData {
    type: NotificationType;
    meta: MailOptions;
    payload: Record<string, string>;
}
export interface MailConfiguration {
    fromAddress: string;
    replyToAddress: string;
}

export interface MailOptions {
    replyTo: string;
    from: string;
    to: string;
    cc: string[];
    subject: string;
    attachments: Attachment[];
}

export interface Address {
    instituteName: string;
    department?: string;
    street: string;
    zip: string;
    city: string;
    contactPerson: string;
    telephone: string;
    email: string;
}

export const VALID_SHEET_NAME: string = 'Einsendeformular';

export const FORM_PROPERTIES: string[] = [
    'sample_id',
    'sample_id_avv',
    'partial_sample_id',
    'pathogen_avv',
    'pathogen_text',
    'sampling_date',
    'isolation_date',
    'sampling_location_avv',
    'sampling_location_zip',
    'sampling_location_text',
    'animal_avv',
    'matrix_avv',
    'animal_matrix_text',
    'primary_production_avv',
    'control_program_avv',
    'sampling_reason_avv',
    'program_reason_text',
    'operations_mode_avv',
    'operations_mode_text',
    'vvvo',
    'program_avv',
    'comment'
];

export const FORM_PROPERTIES_NRL: string[] = [
    'sample_id',
    'sample_id_avv',
    'partial_sample_id',
    'pathogen_avv',
    'pathogen_text',
    'sampling_date',
    'isolation_date',
    'sampling_location_avv',
    'sampling_location_text_avv',
    'sampling_location_zip',
    'sampling_location_text',
    'animal_avv',
    'animal_text_avv',
    'matrix_avv',
    'matrix_text_avv',
    'animal_matrix_text',
    'primary_production_avv',
    'primary_production_text_avv',
    'control_program_avv',
    'control_program_text_avv',
    'sampling_reason_avv',
    'sampling_reason_text_avv',
    'program_reason_text',
    'operations_mode_avv',
    'operations_mode_text_avv',
    'operations_mode_text',
    'vvvo',
    'program_avv',
    'program_text_avv',
    'comment'
];
export interface FileBuffer {
    buffer: Buffer;
    mimeType: string;
    extension: string;
}

export const DEFAULT_SAMPLE_DATA_HEADER_ROW = 41;
export const SAMPLE_DATA_HEADER_ROW_MARKER = 'Ihre Probe-nummer';

export const META_EXCEL_VERSION = 'B3';
export const META_NRL_CELL = 'B7';
export const META_URGENCY_CELL = 'L27';
export const META_SENDER_INSTITUTENAME_CELL = 'C12';
export const META_SENDER_DEPARTMENT_CELL = 'C15';
export const META_SENDER_STREET_CELL = 'C17';
export const META_SENDER_ZIP_CITY_CELL = 'C19';
export const META_SENDER_CONTACTPERSON_CELL = 'C20';
export const META_SENDER_TELEPHONE_CELL = 'C21';
export const META_SENDER_EMAIL_CELL = 'C22';
export const META_CUSTOMER_REF_NUMBER_CELL = 'R6';
export const META_SIGNATURE_DATE_CELL = 'A27';
export const META_ANALYSIS_SPECIES_CELL = 'P12';
export const META_ANALYSIS_SEROLOGICAL_CELL = 'P13';
export const META_ANALYSIS_RESISTANCE_CELL = 'P14';
export const META_ANALYSIS_VACCINATION_CELL = 'P15';
export const META_ANALYSIS_MOLECULARTYPING_CELL = 'P16';
export const META_ANALYSIS_TOXIN_CELL = 'P17';
export const META_ANALYSIS_ESBLAMPCCARBAPENEMASEN_CELL = 'P18';
export const META_ANAYLSIS_OTHER_BOOL_CELL = 'P19';
export const META_ANALYSIS_OTHER_TEXT_CELL = 'J20';
export const META_ANALYSIS_COMPAREHUMAN_BOOL_CELL = 'P22';
export const META_ANALYSIS_COMPAREHUMAN_TEXT_CELL = 'J23';
