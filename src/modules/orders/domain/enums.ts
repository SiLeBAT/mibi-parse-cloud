export enum Bundesland {
    BW = 'BW',
    BY = 'BY',
    BE = 'BE',
    BB = 'BB',
    HB = 'HB',
    HH = 'HH',
    HE = 'HE',
    MV = 'MV',
    NI = 'NI',
    NW = 'NW',
    RP = 'RP',
    SL = 'SL',
    ST = 'ST',
    SH = 'SH',
    SN = 'SN',
    TH = 'TH',
    UNKNOWN = 'unbekannt'
}

export enum SERVER_ERROR_CODE {
    UNKNOWN_ERROR = 1,
    INVALID_INPUT = 5,
    AUTOCORRECTED_INPUT = 6,
    INVALID_VERSION = 7,
    INVALID_EMAIL = 8
}

export enum ReceiveAs {
    EXCEL,
    PDF
}
