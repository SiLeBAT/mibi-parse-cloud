export const ObjectKeys = {
    NRL: 'NRL',
    UserInformation: 'User_Info',
    Institute: 'institutions'
};
export interface InstituteAttributes extends Parse.Attributes {
    state_short: string;
}

export interface InstituteObject extends Parse.Object<InstituteAttributes> {}
export interface NRLAttributes extends Parse.Attributes {}

export interface NRLObject extends Parse.Object<NRLAttributes> {}

export interface UserInformationAttributes extends Parse.Attributes {
    institute: InstituteObject;
    user: Parse.User;
}

export interface UserInformationObject
    extends Parse.Object<UserInformationAttributes> {}
