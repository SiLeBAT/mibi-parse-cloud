export const ObjectKeys = {
    NRL: 'NRL',
    TEMPLATE_FILE: 'Template_File',
    UserInformation: 'User_Info',
    Institute: 'institutions'
};

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
