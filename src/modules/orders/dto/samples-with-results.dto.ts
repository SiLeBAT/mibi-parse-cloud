import { SampleDataDTO, SampleMetaDTO } from './submission.dto';

export type ResultDataDTO = Record<string, string>;

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
