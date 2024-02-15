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

interface SampleDataEntryDTO {
    value: string;
    errors?: SampleValidationErrorDTO[];
    correctionOffer?: string[];
    oldValue?: string;
}
interface SampleDataDTO {
    [key: string]: SampleDataEntryDTO;
}

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
