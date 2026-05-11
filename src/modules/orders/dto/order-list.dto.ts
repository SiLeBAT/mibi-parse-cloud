export interface OrderEntryDTO {
    id: string;
    createdAt: Date;
    sampleCount: number;
    version: string;
    fileName: string;
    nrls: string[];
    pathogens: string[];
    results: string;
}

export interface OrderCollectionDTO {
    orders: OrderEntryDTO[];
}
