export const ObjectKeys = {
    AdditionalPathogens: 'Additional_Pathogens',
    AVVCatalogue: 'AVV_Catalogue'
};

export interface AVVCatalogueAttributes extends Parse.Attributes {
    version?: string;
    validFrom?: Date;
    catalogueFile: Parse.File;
    catalogueCode?: string;
    catalogueData?: string;
}

export interface AVVCatalogueObject
    extends Parse.Object<AVVCatalogueAttributes> {}

export interface AdditionalPathogensAttributes extends Parse.Attributes {
    pathogen: string;
}

export interface AdditionalPathogensObject
    extends Parse.Object<AdditionalPathogensAttributes> {}
