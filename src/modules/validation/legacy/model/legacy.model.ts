import { NRL_ID_VALUE } from '../../domain';
import { CatalogService } from '../application/catalog.service';
export enum SampleSheetAnalysisOption {
    OMIT,
    ACTIVE,
    STANDARD
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

export interface NRL {
    selectors: string[];
    id: NRL_ID_VALUE;
    email: string;
    standardProcedures: AnalysisProcedure[];
    optionalProcedures: AnalysisProcedure[];
}
interface AnalysisProcedure {
    value: string;
    key: number;
}

export type EditValue = string;

export interface ValidationError {
    code: number;
    level: number;
    message: string;
    correctionOffer?: string[];
}

export enum Urgency {
    NORMAL = 'NORMAL',
    URGENT = 'EILT'
}

export type SampleProperty = keyof SampleData;
export type SampleDataEntries = Record<SampleProperty, SampleDataEntry>;
interface SampleDataEntry {
    value: string;
}

export interface AnnotatedSampleDataEntry extends SampleDataEntry {
    errors: SampleValidationError[];
    correctionOffer: string[];
    oldValue?: string;
    nrlData?: string;
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

export interface SampleMetaData {
    nrl: NRL_ID_VALUE;
    urgency: Urgency;
    analysis: Partial<Analysis>;
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

interface SampleValidationError {
    code: number;
    level: number;
    message: string;
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

export const ZOMO_ID = {
    code: '70564|53075|',
    string1: 'zoonose',
    string2: 'monitoring'
};

export interface CorrectionSuggestions {
    field: SampleProperty;
    original: string;
    correctionOffer: string[];
    code: number;
}

export interface ValidationError {
    code: number;
    level: number;
    message: string;
    correctionOffer?: string[];
}

export interface CorrectionFunction {
    (sampleData: SampleData): CorrectionSuggestions | null;
}

export interface SearchAlias {
    catalog: string;
    token: string;
    alias: string[];
}
export interface ZSPCatalogEntry {
    'ADV8-Kode': string[];
    Kodiersystem: string[];
    'ADV3-Kode': string[];
    'ADV16-Kode': string[];
}

export type CatalogData =
    | Record<string, string>
    | ADVCatalogEntry
    | ZSPCatalogEntry;

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

export interface Sample {
    readonly pathogenIdAVV?: string;
    readonly pathogenId?: string;
    readonly meta: SampleMetaData;
    setNRL(nrlService: unknown, nrl: NRL_ID_VALUE): void;
    getUrgency(): Urgency;
    getNRL(): NRL_ID_VALUE;
    getAnalysis(): Partial<Analysis>;
    getValueFor(property: SampleProperty): string;
    getEntryFor(property: SampleProperty): AnnotatedSampleDataEntry;
    getOldValues(): Record<SampleProperty, EditValue>;
    clone(): Sample;
    getAnnotatedData(): SampleData;
    getDataEntries(): SampleDataEntries;
    addErrorTo(property: SampleProperty, errors: ValidationError): void;
    addCorrectionTo(property: SampleProperty, correctionOffer: string[]): void;
    isValid(): boolean;
    addErrors(errors: ValidationErrorCollection): void;
    isZoMo(): boolean;
    getErrorCount(level: number): number;
    applySingleCorrectionSuggestions(): void;
    supplementAVV313Data(zip: string, city: string): void;
}

export interface AVV313Eintrag extends MibiEintrag {
    PLZ: string;
    Name: string;
}

export interface MibiFacettenEintrag extends MibiEintrag {
    FacettenIds: number[];
    Attribute?: string;
}

interface MibiFacetten {
    [key: string]: MibiFacette;
}

export interface MibiCatalogFacettenData extends MibiCatalogData {
    facetten: MibiFacetten;
}
export interface MibiFacette {
    FacettenId: number;
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

export type AVVCatalogData =
    | MibiCatalogData
    | MibiCatalogFacettenData
    | AVV324Data;

export interface ValidationError {
    code: number;
    level: number;
    message: string;
    correctionOffer?: string[];
}

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

export interface Validator {
    validateSample(
        sample: Sample,
        constraintSet: ValidationConstraints
    ): ValidationErrorCollection;
}

export interface ValidationErrorCollection {
    [key: string]: ValidationError[];
}

export interface ValidatorConfig {
    dateFormat: string;
    dateTimeFormat: string;
    catalogService: CatalogService;
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

export interface AVVFormatCollection {
    [key: string]: string[];
}

export interface AVVFormatProvider {
    getFormat(state?: string): string[];
}

export interface ValidationOptions {
    state?: string;
    year?: string;
}
export interface FormValidatorPort {
    validateSamples(
        sampleCollection: Sample[],
        validationOptions: ValidationOptions
    ): Promise<Sample[]>;
}

export interface FormValidatorService extends FormValidatorPort {}

export interface ValidationErrorProviderPort {}

export interface ValidationErrorProvider extends ValidationErrorProviderPort {
    getError(id: number): ValidationError;
}

export type SampleDataValues = Record<SampleProperty, string>;
export interface ValidatorFunction<T extends ValidatorFunctionOptions> {
    (
        value: string,
        options: T,
        key: SampleProperty,
        attributes: SampleDataValues
    ): ValidationError | null;
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

interface Group {
    code: keyof ZSPCatalogEntry;
    attr: SampleProperty;
}

export interface RegisteredZoMoOptions extends ValidatorFunctionOptions {
    year: string[];
    group: Group[];
    catalog: string;
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
