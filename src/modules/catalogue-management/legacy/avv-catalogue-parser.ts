import { XMLParser } from 'fast-xml-parser';
import * as _ from 'lodash';

import { pathogenRepository } from '../infrastructure/repository';
import {
    AttributWert,
    Eintrag,
    Facette,
    FacettenZuordnung,
    KatalogInstance
} from './xml-catalog.model';

export interface LegacyCatalog<T> {
    data: T;
    uId: string;
}

interface CatalogData {
    version: string;
    gueltigAb: string;
    katalogName: string;
    katalogNummer: string;
    facettenErlaubt: boolean;
    eintraege: MibiEintraege;
}

interface AVV324Data extends CatalogData {
    textEintraege: AVV324Eintraege;
    fuzzyEintraege: FuzzyEintrag[];
}

interface MibiFacettenIds {
    [key: string]: MibiFacettenId;
}

interface MibiFacettenId {
    [key: string]: MibiFacettenWertId;
}

interface MibiFacettenWertId {
    FacettenNameBegriffsId: number;
    WertNameBegriffsId: number;
}

interface MibiEintraege {
    [key: string]: MibiEintrag | AVV313Eintrag | MibiFacettenEintrag;
}

interface AVV324Eintraege {
    [key: string]: string;
}

interface MibiEintrag {
    Text: string;
    Basiseintrag: boolean;
}

interface AVV313Eintrag extends MibiEintrag {
    PLZ: string;
    Name: string;
}

interface FuzzyEintrag extends MibiEintrag {
    Kode: string;
}

interface MibiFacettenEintrag extends MibiEintrag {
    FacettenIds: number[];
    Facettenzuordnungen?: MibiFacettenzuordnung[];
    Attribute?: string;
}

interface MibiFacetten {
    [key: string]: MibiFacette;
}

interface MibiFacette {
    FacettenId: number;
    MehrfachAuswahl: boolean;
    Text: string;
    FacettenWerte: MibiFacettenWerte;
}

interface MibiFacettenWerte {
    [key: string]: MibiFacettenWert;
}

interface MibiFacettenWert {
    Text: string;
}

interface TempEintrag {
    Kode: string;
    Text: string;
    Basiseintrag: boolean;
    Festgelegt: boolean;
    PLZ?: string;
    Name?: string;
    Attribute?: string;
    FacettenIds?: number[];
    Facettenzuordnungen?: MibiFacettenzuordnung[];
}

interface MibiFacettenzuordnung {
    FacettenId: number;
    FacettenwertId: number;
    Festgelegt: boolean;
}

export class AVVCatalogueParser {
    private alwaysArray = [
        'katalog.eintragsTyp.eintraege.attributwerte.attribute',
        'katalog.eintragsTyp.eintraege.facettenZuordnungTyp.facettenzuordnungen',
        'katalog.facettenTyp.facetten.facettenWerteTyp.facettenwerte'
    ];
    private parserOptions = {
        ignoreAttributes: false,
        parseAttributeValue: true,
        removeNSPrefix: true,
        attributeNamePrefix: '$',
        allowBooleanAttributes: true,
        ignoreDeclaration: true,
        textNodeName: 'text',
        trimValues: true,
        numberParseOptions: {
            leadingZeros: false,
            hex: true,
            skipLike: /\.[0-9]*0/
        },
        isArray: (_name: string, jpath: string) => {
            if (this.alwaysArray.indexOf(jpath) !== -1) return true;
            return false;
        },
        transformTagName: (tagName: string) => {
            if (tagName === 'Katalog') return 'katalog';
            else if (tagName === 'Katalogname') return 'katalogname';
            else if (tagName === 'Katalognummer') return 'katalognummer';
            else if (tagName === 'Sprache') return 'sprache';
            else if (tagName === 'SpracheID') return 'spracheID';
            else if (tagName === 'Katalogtyp') return 'katalogtyp';
            else if (tagName === 'Einleitung') return 'einleitung';
            else if (tagName === 'FacettenErlaubt') return 'facettenErlaubt';
            else if (tagName === 'Versionsnummer') return 'versionsnummer';
            else if (tagName === 'Veroeffentlicht') return 'veroeffentlicht';
            else if (tagName === 'KodierungsTrennzeichen')
                return 'kodierungsTrennzeichen';
            else if (tagName === 'MerkmalWertTrennzeichen')
                return 'merkmalWertTrennzeichen';
            else if (tagName === 'MehrereWerteTrennzeichen')
                return 'mehrereWerteTrennzeichen';
            else if (tagName === 'Arbeitsversion') return 'arbeitsversion';
            else if (tagName === 'GueltigAb') return 'gueltigAb';
            else if (tagName === 'GueltigBis') return 'gueltigBis';
            else if (tagName === 'Name') return 'name';
            else if (tagName === 'Synonyme') return 'synonyme';
            else if (tagName === 'Eintragsname') return 'eintragsname';
            else if (tagName === 'Attributwerte') return 'attributwerte';
            else if (tagName === 'Untereintraege') return 'untereintraege';
            else if (tagName === 'Oberbegriffe') return 'oberbegriffe';
            else if (tagName === 'Erlauterungen') return 'erlauterungen';
            else if (tagName === 'Eingabehilfen') return 'eingabehilfen';
            else if (tagName === 'Eingabehilfename') return 'eingabehilfename';
            else if (tagName === 'Facettenzuordnungen')
                return 'facettenZuordnungTyp';
            else if (tagName === 'Facettenzuordnung')
                return 'facettenzuordnungen';
            else if (tagName === 'FacettenName') return 'facettenName';
            else if (tagName === 'Facettenwerte') return 'facettenWerteTyp';
            else if (tagName === 'Facettenwert') return 'facettenwerte';
            else if (tagName === 'Wertname') return 'wertName';
            else if (tagName === 'Attributname') return 'attributname';
            else if (tagName === 'Eintraege') return 'eintragsTyp';
            else if (tagName === 'Eintrag') return 'eintraege';
            else if (tagName === 'Attribute') return 'attributTyp';
            else if (tagName === 'Attribut') return 'attribute';
            else if (tagName === 'Facetten') return 'facettenTyp';
            else if (tagName === 'Facette') return 'facetten';

            return tagName.toLowerCase();
        }
    };
    private parser = new XMLParser(this.parserOptions);

    private parsingFunctions = {
        '303': this.avv303.bind(this),
        '313': this.avv313.bind(this),
        '316': this.avv316.bind(this),
        '319': this.avv319.bind(this),
        '322': this.avv322.bind(this),
        '324': this.avv324.bind(this),
        '326': this.avv326.bind(this),
        '328': this.avv328.bind(this),
        '339': this.avv339.bind(this)
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parseXML<T>(fileContent: string): Promise<LegacyCatalog<T>> {
        const catalogueCode = this.determineCatalogueNumber(fileContent);
        // @ts-expect-error: Fix later
        return this.parsingFunctions[catalogueCode](fileContent);
    }

    determineCatalogueNumber(fileContent: string): string {
        const catalogData = this.parser.parse(fileContent);
        return catalogData.katalog.metadaten.katalognummer.toString();
    }

    determineVersion(fileContent: string): string {
        const catalogData = this.parser.parse(fileContent);
        return catalogData.katalog.metadaten.versionsnummer.toString();
    }

    determineValidFrom(fileContent: string): string {
        const catalogData = this.parser.parse(fileContent);
        return this.extractDateFromGueltigAbField(
            catalogData.katalog.metadaten.gueltigAb.toString()
        );
    }

    private getStandardData(catalogue: KatalogInstance) {
        return {
            version: catalogue.katalog.metadaten.versionsnummer.toString(),
            gueltigAb: this.extractDateFromGueltigAbField(
                catalogue.katalog.metadaten.gueltigAb.toString()
            ),
            katalogName: catalogue.katalog.metadaten.katalogname.name,
            katalogNummer: catalogue.katalog.metadaten.katalognummer.toString(),
            facettenErlaubt: catalogue.katalog.metadaten.facettenErlaubt,
            eintraege: catalogue.katalog.eintragsTyp.eintraege
        };
    }

    private async avv303(xmlData: string): Promise<LegacyCatalog<CatalogData>> {
        // Katalogtyp: Monohierarchische Klassifikation mit Facetten
        // Betriebsarten und -taetigkeiten

        const catalog303: KatalogInstance = this.parser.parse(
            xmlData
        ) as KatalogInstance;
        const standardData = this.getStandardData(catalog303);
        const facetten = catalog303.katalog.facettenTyp.facetten;

        const mibiEintraege: MibiEintraege = {};

        this.collectEintraege(standardData.eintraege, [])
            .map(eintrag => this.getAVV303EntryFromEintrag(eintrag))
            .forEach((tempEintrag: TempEintrag) => {
                mibiEintraege[tempEintrag.Kode] = {
                    Text: tempEintrag.Text.normalize('NFC'),
                    Basiseintrag: tempEintrag.Basiseintrag,
                    Attribute: tempEintrag.Attribute,
                    FacettenIds:
                        tempEintrag.Basiseintrag === true
                            ? tempEintrag.FacettenIds
                            : []
                };
            });
        const mibiFacetten = this.getMibiFacetten(facetten);
        return Promise.resolve({
            data: {
                ...standardData,
                eintraege: mibiEintraege,
                facetten: mibiFacetten
            },
            uId: 'Kode'
        });
    }

    private async avv313(xmlData: string): Promise<LegacyCatalog<CatalogData>> {
        // Katalogtyp: Monohierarchische Klassifikation
        // Amtliche Gemeindeschluessel

        const catalog313: KatalogInstance = this.parser.parse(
            xmlData
        ) as KatalogInstance;
        const standardData = this.getStandardData(catalog313);

        const mibiEintraege: MibiEintraege = {};

        this.collectEintraege(standardData.eintraege, [])
            .map(eintrag => this.getAVV313TempEintragFromEintrag(eintrag))
            .forEach((tempEintrag: TempEintrag) => {
                mibiEintraege[tempEintrag.Kode] = {
                    Text: tempEintrag.Text.normalize('NFC'),
                    Basiseintrag: tempEintrag.Basiseintrag,
                    PLZ: tempEintrag.PLZ,
                    Name: tempEintrag.Name
                };
            });

        return Promise.resolve({
            data: {
                ...standardData,
                eintraege: mibiEintraege
            },
            uId: 'Kode'
        });
    }

    private async avv316(xmlData: string): Promise<LegacyCatalog<CatalogData>> {
        // Katalogtyp: Liste
        // Angaben zur Primaerproduktion

        const catalog316: KatalogInstance = this.parser.parse(
            xmlData
        ) as KatalogInstance;

        const standardData = this.getStandardData(catalog316);

        const mibiEintraege: MibiEintraege = {};

        this.collectEintraege(standardData.eintraege, [])
            .map(eintrag => this.getTempEintragFromEintrag(eintrag))
            .forEach((tempEintrag: TempEintrag) => {
                mibiEintraege[tempEintrag.Kode] = {
                    Text: tempEintrag.Text.normalize('NFC'),
                    Basiseintrag: tempEintrag.Basiseintrag
                };
            });

        return Promise.resolve({
            data: {
                ...standardData,
                eintraege: mibiEintraege
            },
            uId: 'Kode'
        });
    }

    private async avv319(xmlData: string): Promise<LegacyCatalog<CatalogData>> {
        // Katalogtyp: Monohierarchische Klassifikation mit Facetten
        // Matrizes

        const catalog319: KatalogInstance = this.parser.parse(
            xmlData
        ) as KatalogInstance;
        const standardData = this.getStandardData(catalog319);
        const facetten = catalog319.katalog.facettenTyp.facetten;

        const mibiEintraege: MibiEintraege = {};

        this.collectEintraegeWithFacetten(standardData.eintraege, []).forEach(
            (tempEintrag: TempEintrag) => {
                mibiEintraege[tempEintrag.Kode] = {
                    Text: tempEintrag.Text.normalize('NFC'),
                    Basiseintrag: tempEintrag.Basiseintrag,
                    Facettenzuordnungen:
                        tempEintrag.Facettenzuordnungen !== undefined
                            ? tempEintrag.Facettenzuordnungen
                            : [],
                    FacettenIds:
                        tempEintrag.Basiseintrag === true
                            ? tempEintrag.FacettenIds
                            : []
                };
            }
        );

        const mibiFacetten = this.getMibiFacetten(facetten);
        const mibiFacettenIds = this.getMibiFacettenIds(facetten);

        return Promise.resolve({
            data: {
                ...standardData,
                eintraege: mibiEintraege,
                facetten: mibiFacetten,
                facettenIds: mibiFacettenIds
            },
            uId: 'Kode'
        });
    }

    private async avv322(xmlData: string): Promise<LegacyCatalog<CatalogData>> {
        // Katalogtyp: Liste
        // Kontrollprogramme und weitere Mitteilungsgruende

        const catalog322: KatalogInstance = this.parser.parse(
            xmlData
        ) as KatalogInstance;
        const standardData = this.getStandardData(catalog322);

        const mibiEintraege: MibiEintraege = {};

        this.collectEintraege(standardData.eintraege, [])
            .map(eintrag => this.getTempEintragFromEintrag(eintrag))
            .forEach((tempEintrag: TempEintrag) => {
                mibiEintraege[tempEintrag.Kode] = {
                    Text: tempEintrag.Text.normalize('NFC'),
                    Basiseintrag: tempEintrag.Basiseintrag
                };
            });

        return Promise.resolve({
            data: {
                ...standardData,
                eintraege: mibiEintraege
            },
            uId: 'Kode'
        });
    }

    private async avv324(xmlData: string): Promise<LegacyCatalog<AVV324Data>> {
        // Katalogtyp: Polyhierarchische Klassifikation
        // Parameter

        const filter: string[] = ['DNA', 'Mikroorganismen', 'Bakterientoxine'];

        const catalog324: KatalogInstance = this.parser.parse(
            xmlData
        ) as KatalogInstance;
        const standardData = this.getStandardData(catalog324);
        const eintraege = catalog324.katalog.eintragsTyp.eintraege.filter(
            eintrag => {
                let valueIncluded = false;
                if (eintrag.eintragsname) {
                    valueIncluded = filter.includes(eintrag.eintragsname.name);
                }
                return valueIncluded;
            }
        );

        const mibiEintraege: MibiEintraege = {};
        const textEintraege: AVV324Eintraege = {};
        const fuzzyEintraege: FuzzyEintrag[] = [];

        const avv324 = this.collectEintraege(eintraege, []).map(eintrag =>
            this.getTempEintragFromEintrag(eintrag)
        );

        // tslint:disable-next-line
        const avv324Unique: MibiEintrag[] = _.uniqWith(avv324, _.isEqual);
        const additionalPathogens = await this.getAdditionalPathogens();
        const duplicatePathogens: string[] = [];

        avv324Unique.forEach((tempEintrag: TempEintrag) => {
            const normalizedText = tempEintrag.Text.normalize('NFC');
            if (additionalPathogens.includes(normalizedText)) {
                duplicatePathogens.push(normalizedText);
            }

            mibiEintraege[tempEintrag.Kode] = {
                Text: normalizedText,
                Basiseintrag: tempEintrag.Basiseintrag
            };
            textEintraege[normalizedText] = tempEintrag.Kode;
            fuzzyEintraege.push({
                Kode: tempEintrag.Kode,
                Text: normalizedText,
                Basiseintrag: tempEintrag.Basiseintrag
            });
        });

        /* Refactor this one second: addition of additionalPathogens should     * happen external to XML parsing:
         * 1) Parse the XML and create a JSON Catalogue
         * 2) add the additional Pathogens to that catalogue
         */
        const filteredPathogens = additionalPathogens.filter(
            pathogen => !duplicatePathogens.includes(pathogen)
        );

        filteredPathogens.forEach((bfrErreger: string) => {
            textEintraege[bfrErreger] = '';
            fuzzyEintraege.push({
                Kode: '',
                Text: bfrErreger.normalize('NFC'),
                Basiseintrag: true
            });
        });

        return {
            data: {
                ...standardData,
                eintraege: mibiEintraege,
                textEintraege: textEintraege,
                fuzzyEintraege: fuzzyEintraege
            },
            uId: 'Kode'
        };
    }

    private async avv326(xmlData: string): Promise<LegacyCatalog<CatalogData>> {
        // Katalogtyp: Monohierarchische Klassifikation
        // Probenarten und Untersuchungsgruende

        const catalog326: KatalogInstance = this.parser.parse(
            xmlData
        ) as KatalogInstance;
        const standardData = this.getStandardData(catalog326);

        const mibiEintraege: MibiEintraege = {};

        this.collectEintraege(standardData.eintraege, [])
            .map(eintrag => this.getTempEintragFromEintrag(eintrag))
            .forEach((tempEintrag: TempEintrag) => {
                mibiEintraege[tempEintrag.Kode] = {
                    Text: tempEintrag.Text.normalize('NFC'),
                    Basiseintrag: tempEintrag.Basiseintrag
                };
            });

        return Promise.resolve({
            data: {
                ...standardData,
                eintraege: mibiEintraege
            },
            uId: 'Kode'
        });
    }

    private async avv328(xmlData: string): Promise<LegacyCatalog<CatalogData>> {
        // Katalogtyp: Monohierarchische Klassifikation
        // Programm- oder Projektnummern

        const catalog328: KatalogInstance = this.parser.parse(
            xmlData
        ) as KatalogInstance;
        const standardData = this.getStandardData(catalog328);

        const mibiEintraege: MibiEintraege = {};

        this.collectEintraege(standardData.eintraege, [])
            .map(eintrag => this.getTempEintragFromEintrag(eintrag))
            .forEach((tempEintrag: TempEintrag) => {
                mibiEintraege[tempEintrag.Kode] = {
                    Text: tempEintrag.Text.normalize('NFC'),
                    Basiseintrag: tempEintrag.Basiseintrag
                };
            });

        return Promise.resolve({
            data: {
                ...standardData,
                eintraege: mibiEintraege
            },
            uId: 'Kode'
        });
    }

    private async avv339(xmlData: string): Promise<LegacyCatalog<CatalogData>> {
        // Katalogtyp: Monohierarchische Klassifikation mit Facetten
        // Tiere

        const catalog339: KatalogInstance = this.parser.parse(
            xmlData
        ) as KatalogInstance;
        const standardData = this.getStandardData(catalog339);
        const facetten = catalog339.katalog.facettenTyp.facetten;

        const mibiEintraege: MibiEintraege = {};

        this.collectEintraegeWithFacetten(standardData.eintraege).forEach(
            (tempEintrag: TempEintrag) => {
                mibiEintraege[tempEintrag.Kode] = {
                    Text: tempEintrag.Text.normalize('NFC'),
                    Basiseintrag: tempEintrag.Basiseintrag,
                    FacettenIds:
                        tempEintrag.Basiseintrag === true
                            ? tempEintrag.FacettenIds
                            : []
                };
            }
        );

        const mibiFacetten = this.getMibiFacetten(facetten);

        return Promise.resolve({
            data: {
                ...standardData,
                eintraege: mibiEintraege,
                facetten: mibiFacetten
            },
            uId: 'Kode'
        });
    }

    private collectEintraegeWithFacetten(
        eintraege: Eintrag[],
        parentFacettenIds: number[] = [],
        tempEintraege: TempEintrag[] = []
    ) {
        if (!Array.isArray(eintraege)) {
            this.collectEintragWithFacetten(
                eintraege as Eintrag,
                parentFacettenIds,
                tempEintraege
            );
        } else {
            eintraege.forEach(eintrag => {
                this.collectEintragWithFacetten(
                    eintrag,
                    parentFacettenIds,
                    tempEintraege
                );
            });
        }

        return tempEintraege;
    }

    private collectEintragWithFacetten(
        eintrag: Eintrag,
        parentFacettenIds: number[] = [],
        tempEintraege: TempEintrag[]
    ) {
        const AKTION_DELETE = 'DELETE';

        if (!(eintrag.$aktion === AKTION_DELETE)) {
            const tempEintrag: TempEintrag =
                this.getFacettenEntryFromEintrag(eintrag);
            const tempFacettenIds: number[] = tempEintrag.FacettenIds
                ? tempEintrag.FacettenIds
                : [];
            const combinedFacettenIds = [
                ...parentFacettenIds,
                ...tempFacettenIds
            ];
            tempEintrag.FacettenIds = _.uniq(combinedFacettenIds);

            tempEintraege.push(tempEintrag);
            if (eintrag.untereintraege) {
                const untereintraege = eintrag.untereintraege.eintraege;
                tempEintraege = tempEintraege.concat(
                    this.collectEintraegeWithFacetten(
                        untereintraege,
                        combinedFacettenIds,
                        tempEintraege
                    )
                );
            }
        }

        return tempEintraege;
    }

    private extractDateFromGueltigAbField(dateGueltigAb: string): string {
        const dateArray = dateGueltigAb.split('+');
        const gueltigAb = dateArray[0];

        return gueltigAb;
    }

    private collectEintraege(eintraege: Eintrag[], eintragsListe: Eintrag[]) {
        if (!Array.isArray(eintraege)) {
            this.processEintrag(eintraege as Eintrag, eintragsListe);
        } else {
            eintraege.forEach(eintrag => {
                this.processEintrag(eintrag, eintragsListe);
            });
        }

        return eintragsListe;
    }

    private processEintrag(eintrag: Eintrag, eintragsListe: Eintrag[]) {
        const AKTION_DELETE = 'DELETE';

        if (!(eintrag.$aktion === AKTION_DELETE)) {
            eintragsListe.push(eintrag);
        }
        if (eintrag.untereintraege) {
            const untereintraege = eintrag.untereintraege.eintraege;
            this.collectEintraege(untereintraege, eintragsListe);
        }
    }

    private getTempEintragFromEintrag(eintrag: Eintrag): TempEintrag {
        const begriffsId = eintrag.eintragsname?.$begriffsid;
        const id = eintrag.$id;

        const tempEintrag: TempEintrag = {
            Kode: begriffsId ? `${begriffsId}|${id}|` : '',
            Text: eintrag.eintragsname
                ? eintrag.eintragsname.name.toString()
                : '',
            Basiseintrag: eintrag.$basiseintrag,
            Festgelegt: false
        };

        return tempEintrag;
    }

    private getAVV313TempEintragFromEintrag(eintrag: Eintrag): TempEintrag {
        const begriffsId = eintrag.eintragsname?.$begriffsid;
        const id = eintrag.$id;
        const name = eintrag.eintragsname
            ? eintrag.eintragsname.name.toString()
            : '';
        let gemeindeBezeichnung = '';
        let plz = '';
        if (eintrag.attributwerte) {
            const attribute = eintrag.attributwerte?.attribute;

            if (!Array.isArray(attribute)) {
                [gemeindeBezeichnung, plz] = this.processAVV313Attribut(
                    attribute as AttributWert,
                    gemeindeBezeichnung,
                    plz
                );
            } else {
                attribute.forEach(attribut => {
                    [gemeindeBezeichnung, plz] = this.processAVV313Attribut(
                        attribut,
                        gemeindeBezeichnung,
                        plz
                    );
                });
            }
        }

        return {
            Kode: begriffsId ? `${begriffsId}|${id}|` : '',
            Text: gemeindeBezeichnung,
            Basiseintrag: eintrag.$basiseintrag,
            Festgelegt: false,
            Name: name,
            PLZ: plz
        };
    }

    private getFacettenEntryFromEintrag(eintrag: Eintrag): TempEintrag {
        const mibiEintrag = this.getTempEintragFromEintrag(eintrag);
        const facettenIds: number[] = [];
        const facettenzuordnungen: MibiFacettenzuordnung[] = [];

        if (eintrag.facettenZuordnungTyp) {
            if (
                !Array.isArray(eintrag.facettenZuordnungTyp.facettenzuordnungen)
            ) {
                const facettenZuordnung = eintrag.facettenZuordnungTyp
                    .facettenzuordnungen as FacettenZuordnung;
                facettenIds.push(facettenZuordnung.$facettenid);
                if (facettenZuordnung.$festgelegt === true) {
                    mibiEintrag.Festgelegt = true;
                    facettenzuordnungen.push({
                        FacettenId: facettenZuordnung.$facettenid,
                        FacettenwertId: facettenZuordnung.$facettenwertid,
                        Festgelegt: facettenZuordnung.$festgelegt
                    });
                }
            } else {
                eintrag.facettenZuordnungTyp.facettenzuordnungen.forEach(
                    facettenZuordnung => {
                        facettenIds.push(facettenZuordnung.$facettenid);
                        if (facettenZuordnung.$festgelegt === true) {
                            mibiEintrag.Festgelegt = true;
                            facettenzuordnungen.push({
                                FacettenId: facettenZuordnung.$facettenid,
                                FacettenwertId:
                                    facettenZuordnung.$facettenwertid,
                                Festgelegt: facettenZuordnung.$festgelegt
                            });
                        }
                    }
                );
            }
        }

        mibiEintrag.Facettenzuordnungen = facettenzuordnungen;

        const uniqueFacettenIDs = _.uniq(facettenIds);

        return {
            ...mibiEintrag,
            FacettenIds: uniqueFacettenIDs
        };
    }

    private getAVV303EntryFromEintrag(eintrag: Eintrag): TempEintrag {
        const mibiEintrag = this.getTempEintragFromEintrag(eintrag);
        const attributValue = 716;

        const attribute = eintrag.attributwerte?.attribute
            .map(attribut => {
                return attribut.$attributid === attributValue
                    ? attribut.text.toString()
                    : '';
            })
            .join(':');

        const facettenIds: number[] = [];

        if (eintrag.facettenZuordnungTyp) {
            if (
                !Array.isArray(eintrag.facettenZuordnungTyp.facettenzuordnungen)
            ) {
                const facettenZuordnung = eintrag.facettenZuordnungTyp
                    .facettenzuordnungen as FacettenZuordnung;
                facettenIds.push(facettenZuordnung.$facettenid);
            } else {
                eintrag.facettenZuordnungTyp.facettenzuordnungen.forEach(
                    facettenZuordnung => {
                        facettenIds.push(facettenZuordnung.$facettenid);
                    }
                );
            }
        }

        const uniqueFacettenIDs = _.uniq(facettenIds);

        return {
            ...mibiEintrag,
            Attribute: attribute || '',
            FacettenIds: uniqueFacettenIDs
        };
    }

    private getMibiFacetten(facetten: Facette[]): MibiFacetten {
        const mibiFacetten: MibiFacetten = {};

        facetten.forEach(facette => {
            const begriffsId = facette.facettenName.$begriffsid;
            const id = facette.$id;
            const name = facette.facettenName.name.toString();
            const mehrfachAuswahl = facette.$mehrfachauswahl;
            const facettenWerte: MibiFacettenWerte =
                this.getMibiFacettenWerte(facette);

            mibiFacetten[begriffsId] = {
                FacettenId: id,
                MehrfachAuswahl: mehrfachAuswahl,
                Text: name.normalize('NFC'),
                FacettenWerte: facettenWerte
            };
        });

        return mibiFacetten;
    }

    private getMibiFacettenIds(facetten: Facette[]): MibiFacettenIds {
        const mibiFacettenIds: MibiFacettenIds = {};

        facetten.forEach(facette => {
            const id = facette.$id;
            const mibiFacettenId: MibiFacettenId = {};
            mibiFacettenIds[id] = mibiFacettenId;
            const facettenNameBegriffsId = facette.facettenName.$begriffsid;
            const facettenWerte = facette.facettenWerteTyp.facettenwerte;
            facettenWerte.forEach(facettenWert => {
                const facettenWertId = facettenWert.$id;
                mibiFacettenId[facettenWertId] = {
                    FacettenNameBegriffsId: facettenNameBegriffsId,
                    WertNameBegriffsId: facettenWert.wertName.$begriffsid
                };
            });
        });

        return mibiFacettenIds;
    }

    private getMibiFacettenWerte(facette: Facette): MibiFacettenWerte {
        const mibiFacettenWerte: MibiFacettenWerte = {};
        const facettenWerte = facette.facettenWerteTyp.facettenwerte;

        facettenWerte.forEach(facettenWert => {
            const begriffsId = facettenWert.wertName.$begriffsid;
            const text = facettenWert.wertName.name.toString();

            mibiFacettenWerte[begriffsId] = {
                Text: text.normalize('NFC')
            };
        });

        return mibiFacettenWerte;
    }

    private processAVV313Attribut(
        attribut: AttributWert,
        gemeindeBezeichnung: string,
        plz: string
    ): [string, string] {
        const GEMEINDEBEZEICHNUNG_ID = 1401;
        const PLZ_ID = 1403;
        const ignoreAction = 'DELETE';

        if (
            attribut.$attributid === GEMEINDEBEZEICHNUNG_ID &&
            !(attribut.$aktion === ignoreAction)
        ) {
            gemeindeBezeichnung = attribut.text;
        }
        if (attribut.$attributid === PLZ_ID) {
            plz = attribut.text.toString();
        }

        return [gemeindeBezeichnung, plz];
    }

    // Refactor this one first: DB access should be handled with a properly injected repository -> done!
    private async getAdditionalPathogens(): Promise<string[]> {
        const allPathogens = await pathogenRepository.getAllEntries();

        const pathogens = allPathogens.map(pathogen => {
            return pathogen.pathogen;
        });
        return pathogens;
    }
}
