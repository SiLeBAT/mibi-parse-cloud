interface AddressDTO {
    instituteName: string;
    department?: string;
    street: string;
    zip: string;
    city: string;
    contactPerson: string;
    telephone: string;
    email: string;
}

interface AnalysisDTO {
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
interface SampleSetMetaDTO {
    sender: AddressDTO;
    fileName?: string;
    customerRefNumber?: string;
    signatureDate?: string;
    version?: string;
}

interface SampleValidationErrorDTO {
    code: number;
    level: number;
    message: string;
}

type AVVAttributes =
    | 'sample_id'
    | 'sample_id_avv'
    | 'partial_sample_id'
    | 'pathogen_avv'
    | 'pathogen_text'
    | 'sampling_date'
    | 'isolation_date'
    | 'sampling_location_avv'
    | 'sampling_location_zip'
    | 'sampling_location_text'
    | 'animal_avv'
    | 'matrix_avv'
    | 'animal_matrix_text'
    | 'primary_production_avv'
    | 'control_program_avv'
    | 'sampling_reason_avv'
    | 'program_reason_text'
    | 'operations_mode_avv'
    | 'operations_mode_text'
    | 'vvvo'
    | 'program_avv'
    | 'comment';

interface SampleDataEntryDTO {
    value: string;
    errors?: SampleValidationErrorDTO[];
    correctionOffer?: string[];
    oldValue?: string;
}
interface SampleDataDTO extends Record<AVVAttributes, SampleDataEntryDTO> {}
interface SampleMetaDTO {
    nrl: string;
    analysis: AnalysisDTO;
    urgency: string;
}

export interface SampleDTO {
    sampleData: SampleDataDTO;
    sampleMeta: SampleMetaDTO;
}

export interface SampleSetDTO {
    samples: SampleDTO[];
    meta: SampleSetMetaDTO;
}

export interface OrderDTO {
    sampleSet: SampleSetDTO;
}

export interface OrderContainerDTO {
    order: OrderDTO;
}
