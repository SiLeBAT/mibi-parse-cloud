import Fuse from 'fuse.js';
import {
    AVV313Eintrag,
    AVV324Data,
    AVVCatalogData,
    FuzzyEintrag,
    MibiCatalogData,
    MibiCatalogFacettenData,
    MibiEintrag,
    MibiFacette,
    MibiFacettenEintrag,
    MibiFacettenWert,
    MibiFacettenzuordnung
} from '../model/legacy.model';

export class AVVCatalog<T extends AVVCatalogData> {
    private readonly basicCodeRegex: RegExp = /^\d+\|\d+\|$/;
    private readonly facettenPartRegex =
        /((\d+-\d+(:\d+)*)?(,\d+-\d+(:\d+)*)*)?/;
    private readonly basicCodeRegexSource =
        this.basicCodeRegex.source.substring(
            1,
            this.basicCodeRegex.source.length - 1
        );
    private readonly facettenPartRegexSource = this.facettenPartRegex.source;
    // facettenCodeRegex: /^(\d+\|\d+\|)((\d+-\d+(:\d+)*)?(,\d+-\d+(:\d+)*)*)?$/
    private readonly facettenCodeRegex = new RegExp(
        '^(' +
            this.basicCodeRegexSource +
            ')' +
            this.facettenPartRegexSource +
            '$'
    );

    constructor(private data: T, private uId: string = '') {}

    containsEintragWithAVVKode(kode: string): boolean {
        return kode in this.data.eintraege;
    }

    containsTextEintrag(value: string): boolean {
        if (this.isAVV324Data(this.dump())) {
            return value in (this.data as AVV324Data).textEintraege;
        }
        return false;
    }

    getEintragWithAVVKode(
        kode: string
    ): MibiEintrag | MibiFacettenEintrag | undefined {
        return this.containsEintragWithAVVKode(kode)
            ? this.data.eintraege[kode]
            : undefined;
    }

    getAVV313EintragWithAVVKode(kode: string): AVV313Eintrag | undefined {
        const eintrag = this.getEintragWithAVVKode(kode);
        if (eintrag && this.isAVV313Eintrag(eintrag)) {
            return eintrag;
        }
        return undefined;
    }

    getAttributeWithAVVKode(kode: string): string[] | undefined {
        const eintrag = this.getEintragWithAVVKode(kode);
        if (
            eintrag &&
            this.isMibiFacettenEintrag(eintrag) &&
            'Attribute' in eintrag
        ) {
            return eintrag.Attribute?.split(':');
        }
        return undefined;
    }

    containsFacetteWithBegriffsId(begriffsId: string): boolean {
        if (this.isMibiCatalogFacettenData(this.data)) {
            return begriffsId in this.data.facetten;
        }
        return false;
    }

    getFacettenIdsWithKode(kode: string): number[] | undefined {
        const eintrag = this.getEintragWithAVVKode(kode);
        if (eintrag && this.isMibiFacettenEintrag(eintrag)) {
            return eintrag.FacettenIds;
        }
        return undefined;
    }

    getFacetteWithBegriffsId(begriffsId: string): MibiFacette | undefined {
        if (this.isMibiCatalogFacettenData(this.data)) {
            return this.data.facetten[begriffsId];
        }
        return undefined;
    }

    getFacettenWertWithBegriffsId(
        facettenWertId: string,
        facettenBegriffsId: string
    ): MibiFacettenWert | undefined {
        const facette = this.getFacetteWithBegriffsId(facettenBegriffsId);
        if (facette) {
            return facette.FacettenWerte[facettenWertId];
        }
        return undefined;
    }

    assembleAVVKode(begriffsIdEintrag: string, id: string) {
        return `${begriffsIdEintrag}|${id}|`;
    }

    getTextWithAVVKode(
        kode: string,
        includingFacettenName: boolean = true
    ): string {
        if (this.isFacettenCatalog()) {
            return this.getTextWithFacettenCode(kode, includingFacettenName);
        }

        return this.containsEintragWithAVVKode(kode)
            ? this.data.eintraege[kode].Text
            : '';
    }

    getTextWithFacettenCode(
        kode: string,
        includingFacettenName: boolean = true
    ): string {
        let generatedText = '';

        if (this.isMibiCatalogFacettenData(this.data)) {
            const trimmedValue = kode.trim();
            const [begriffsIdEintrag, id, facettenValues] =
                trimmedValue.split('|');

            if (!(begriffsIdEintrag && id)) {
                return '';
            }

            const avvKode = this.assembleAVVKode(begriffsIdEintrag, id);
            if (this.containsEintragWithAVVKode(avvKode)) {
                const eintrag = this.getEintragWithAVVKode(avvKode)?.Text;
                generatedText += `${eintrag};`;
            }

            const facettenIds = this.getFacettenIdsWithKode(avvKode);
            if (facettenIds && facettenValues) {
                const currentFacetten = facettenValues.split(',');
                currentFacetten.forEach(facettenValue => {
                    const [facettenBeginId, facettenEndeIds] =
                        facettenValue.split('-');
                    const facettenEndeList = facettenEndeIds.split(':');
                    const facette =
                        this.getFacetteWithBegriffsId(facettenBeginId);
                    if (facette && includingFacettenName) {
                        generatedText += ` ${facette.Text} -`;
                    }
                    if (facette && facettenIds.includes(facette.FacettenId)) {
                        facettenEndeList.forEach(facettenEndeId => {
                            const facettenWert =
                                this.getFacettenWertWithBegriffsId(
                                    facettenEndeId,
                                    facettenBeginId
                                );
                            if (facettenWert) {
                                generatedText += ` ${facettenWert.Text},`;
                            }
                        });
                    }

                    const replacedText = generatedText.replace(/.$/, ';');
                    generatedText = replacedText;
                });
            }
            const replacedText = generatedText.replace(/.$/, '');
            generatedText = replacedText;
        }

        return generatedText;
    }

    getObligatoryFacettenzuordnungen(kode: string): MibiFacettenzuordnung[] {
        if (this.isFacettenCatalog()) {
            const eintrag = this.getEintragWithAVVKode(
                kode
            ) as MibiFacettenEintrag;
            return eintrag.Facettenzuordnungen
                ? eintrag.Facettenzuordnungen
                : [];
        }

        return [];
    }

    hasFacettenInfo(kode: string): boolean {
        return this.isFacettenCatalog() && this.facettenCodeRegex.test(kode);
    }

    isBasicCode(kode: string): boolean {
        return this.basicCodeRegex.test(kode);
    }

    private isFacettenCatalog() {
        return this.data.facettenErlaubt;
    }

    private isMibiCatalogFacettenData(
        data: MibiCatalogData | MibiCatalogFacettenData
    ): data is MibiCatalogFacettenData {
        return 'facetten' in data;
    }

    private isMibiFacettenEintrag(
        eintrag: MibiEintrag | MibiFacettenEintrag
    ): eintrag is MibiFacettenEintrag {
        return 'FacettenIds' in eintrag;
    }

    private isAVV324Data(data: AVVCatalogData): data is AVV324Data {
        return 'fuzzyEintraege' in data && 'textEintraege' in data;
    }

    private isAVV313Eintrag(
        eintrag: MibiEintrag | AVV313Eintrag
    ): eintrag is AVV313Eintrag {
        return 'PLZ' in eintrag && 'Name' in eintrag;
    }

    getUniqueId(): string {
        return this.uId;
    }

    dump(): T {
        return this.data;
    }

    getFuzzyIndex(
        options: Fuse.IFuseOptions<FuzzyEintrag>,
        enhancements: FuzzyEintrag[] = []
    ): Fuse<FuzzyEintrag> {
        const data = this.dump() as AVV324Data;
        return new Fuse([...data.fuzzyEintraege, ...enhancements], options);
    }
}

function createAVVCatalog<T extends AVVCatalogData>(
    data: T,
    uId: string = ''
): AVVCatalog<T> {
    return new AVVCatalog(data, uId);
}

export { createAVVCatalog };
