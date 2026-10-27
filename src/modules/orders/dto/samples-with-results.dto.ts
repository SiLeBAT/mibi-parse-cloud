import { SampleDataDTO, SampleMetaDTO } from './submission.dto';

// The LIMS delivers result values as JSON as they are: text, but also numbers
// (e.g. "Biotyp": 4, "MHK CIP": 0.5) and null for an empty measurement. They
// are stored and returned unchanged; the client converts them for display.
export type ResultDataValueDTO = string | number | boolean | null;

export type ResultDataDTO = Record<string, ResultDataValueDTO>;

export interface ResultDTO {
    id: string;
    position: number;
    resultData: ResultDataDTO;
}

export interface SampleWithResultsDTO {
    id: string;
    position: number;
    sampleData: SampleDataDTO;
    sampleMeta: SampleMetaDTO;
    results: ResultDTO[];
}

export interface SamplesWithResultsCollectionDTO {
    orderId: string;
    samples: SampleWithResultsDTO[];
}
