export const ObjectKeys = {
    NRL: 'NRL',
    TEMPLATE_FILE: 'Template_File',
    UserInformation: 'User_Info',
    Institute: 'institutions',
    AllowedPLZ: 'Allowed_PLZ',
    AdditionalPathogens: 'Additional_Pathogens',
    AVVCatalog: 'AVV_Catalog',
    AnalysisProcedure: 'Analysis_Procedure',
    SearchAlias: 'Search_Alias',
    ZomoPlan: 'Zomo_Plan'
};

export interface AVVCatalogAttributes extends Parse.Attributes {
    version: string;
    validFrom: Date;
    catalogFile: Parse.File;
    catalogCode: string;
    catalogData: string;
}

export interface AVVCatalogObject extends Parse.Object<AVVCatalogAttributes> {}

export interface ZomoPlanAttributes extends Parse.Attributes {
    year: string;
    zomoFile: Parse.File;
}

export interface ZomoPlanObject extends Parse.Object<ZomoPlanAttributes> {}

export interface SearchAliasAttributes extends Parse.Attributes {
    catalog: string;
    token: string;
    alias: string[];
}

export interface SearchAliasObject
    extends Parse.Object<SearchAliasAttributes> {}

export interface AdditionalPathogensAttributes extends Parse.Attributes {
    pathogen: string;
}

export interface AdditionalPathogensObject
    extends Parse.Object<AdditionalPathogensAttributes> {}
export interface AnalysisProcedureAttributes extends Parse.Attributes {
    value: string;
    key: number;
}

export interface AnalysisProcedureObject
    extends Parse.Object<AnalysisProcedureAttributes> {}

export interface InstituteAttributes extends Parse.Attributes {
    state_short: string;
    name1: string;
    name2: string;
    zip: string;
    city: string;
    phone: string;
    address1: {
        street: string;
        city: string;
    };
    address2: string;
    email: string[];
    fax: string;
}

export interface InstituteObject extends Parse.Object<InstituteAttributes> {}

export interface UserInformationAttributes extends Parse.Attributes {
    institute: InstituteObject;
    user: Parse.User;
    firstName: string;
    lastName: string;
}

export interface UserInformationObject
    extends Parse.Object<UserInformationAttributes> {}

export interface PLZAttributes extends Parse.Attributes {
    plz: string;
}

export interface PLZObject extends Parse.Object<PLZAttributes> {}

export interface NRLAttributes extends Parse.Attributes {
    standardProcedures: AnalysisProcedureObject[];
    optionalProcedures: AnalysisProcedureObject[];
    name: string;
    selectors: string[];
}

export interface NRLObject extends Parse.Object<NRLAttributes> {}

export interface AnalysisProcedureAttributes extends Parse.Attributes {
    value: string;
    key: number;
}

export interface AnalysisProcedureObject
    extends Parse.Object<AnalysisProcedureAttributes> {}

export interface TemplateFileAttributes extends Parse.Attributes {
    templateFile: Parse.File;
    key?: string;
}

export interface TemplateFileObject
    extends Parse.Object<TemplateFileAttributes> {}
