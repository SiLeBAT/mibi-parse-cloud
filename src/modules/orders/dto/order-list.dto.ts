export interface OrderEntryDTO {
    id: string;
    createdAt: Date;
    sampleCount: number;
    version: string;
    fileName: string;
    nrls: string[];
    pathogens: string[];
    sampleIds: string[];
    sampleIdsAVV: string[];
    results: string;
}

export interface OrderCollectionDTO {
    orders: OrderEntryDTO[];
}

export interface OrderDeletionResultDTO {
    deletedOrderCount: number;
}
