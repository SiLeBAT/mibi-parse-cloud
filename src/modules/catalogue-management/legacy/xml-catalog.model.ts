export interface KatalogInstance {
    katalog: Katalog;
}

export interface Katalog {
    metadaten: MetadatenTyp;
    eintragsTyp: EintragsTyp;
    facettenTyp: FacettenTyp;
    attributTyp?: AttributTyp;
    erlauterungen?: ErlauterungTyp[];
}

export interface MetadatenTyp {
    katalogname: NameTyp;
    katalognummer: string;
    sprache: string;
    spracheID: number;
    katalogtyp: string;
    einleitung?: string;
    facettenErlaubt: boolean;
    versionsnummer: string;
    veroeffentlicht?: boolean;
    kodierung: string;
    kodierungsTrennzeichen: string;
    merkmalWertTrennzeichen: string;
    mehrereWerteTrennzeichen: string;
    arbeitsversion?: boolean;
    gueltigAb?: Date;
    gueltigBis?: Date;
    $aktion: string;
}

export interface NameTyp {
    name: string;
    synonyme?: SynonymeTyp;
    $begriffsid: number;
}

export declare class SynonymeTyp {}

export interface EintragsTyp {
    eintraege: Eintrag[];
}

export interface Eintrag {
    eintragsname?: NameTyp;
    attributwerte?: AttributWerteTyp;
    untereintraege?: EintragsTyp;
    oberbegriffe?: OberbegriffTyp[];
    erlauterungen?: ErlauterungTyp[];
    eingabehilfen?: EingabehilfeTyp[];
    facettenZuordnungTyp?: FacettenZuordnungTyp;
    $id: number;
    $aktion: string;
    $basiseintrag: boolean;
}

export interface AttributWerteTyp {
    attribute: AttributWert[];
}

export interface AttributWert {
    text: string;
    $aktion: string;
    $attributid: number;
    $id: number;
}

export interface OberbegriffTyp {
    name: string;
    $oberbegriffid: number;
}

export interface ErlauterungTyp {
    erlauterungtext?: string;
    $erlauterungid: number;
    $sprachid: number;
}

export interface EingabehilfeTyp {
    eingabehilfename?: NameTyp;
    attributwerte?: AttributWerteTyp;
    erlauterungen?: ErlauterungTyp[];
    facettenzuordnungen?: FacettenZuordnungTyp[];
    $id: number;
    $aktion: string;
}

export interface FacettenZuordnungTyp {
    facettenzuordnungen: FacettenZuordnung[];
}
export interface FacettenZuordnung {
    $aktion: string;
    $id: number;
    $facettenid: number;
    $facettenwertid: number;
    $festgelegt: boolean;
    $vererbt: boolean;
}

export interface FacettenTyp {
    facetten: Facette[];
}

export interface Facette {
    facettenName: NameTyp;
    facettenWerteTyp: FacettenWerteTyp;
    erlauterungen?: ErlauterungTyp[];
    $mehrfachauswahl: boolean;
    $id: number;
    $aktion: string;
}

export interface FacettenWerteTyp {
    facettenwerte: FacettenWert[];
}

export interface FacettenWert {
    wertName: NameTyp;
    $id: number;
    $aktion: string;
}

export interface AttributTyp {
    attribute: Attribut[];
}

export interface Attribut {
    attributname: NameTyp;
    $id: number;
    $aktion: string;
    $mehrfachwahl: boolean;
    $rang: number;
    $sichtbar: boolean;
}
