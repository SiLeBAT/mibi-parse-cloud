import { NRL_ID_VALUE } from './../../domain';

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

export interface ValidationErrorCollection {
    [key: string]: ValidationError[];
}

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
