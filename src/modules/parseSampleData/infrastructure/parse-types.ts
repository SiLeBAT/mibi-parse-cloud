export const ObjectKeys = {
    NRL: 'NRL',
    TEMPLATE_FILE: 'Template_File'
};

export interface NRLAttributes extends Parse.Attributes {}

export interface NRLObject extends Parse.Object<NRLAttributes> {}

export interface TemplateFileAttributes extends Parse.Attributes {
    templateFile: Parse.File;
    key?: string;
}

export interface TemplateFileObject
    extends Parse.Object<TemplateFileAttributes> {}
