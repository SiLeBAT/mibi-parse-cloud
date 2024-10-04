export const ObjectKeys = {
    NRL: 'NRL'
};

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
