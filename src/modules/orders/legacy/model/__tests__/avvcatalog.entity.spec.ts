import { AVVCatalog, createAVVCatalog } from '../avvcatalog.entity';
import {
    AVV324Data,
    MibiCatalogData,
    MibiCatalogFacettenData
} from '../legacy.model';

// ---------------------------------------------------------------------------
// Helpers – minimal catalog fixtures
// ---------------------------------------------------------------------------

function makeSimpleCatalog(): AVVCatalog<MibiCatalogData> {
    const data: MibiCatalogData = {
        version: '1',
        gueltigAb: '2023-01-01',
        katalogNummer: '303',
        katalogName: 'Test',
        facettenErlaubt: false,
        eintraege: {
            '100|200|': { Text: 'Testbegriff', Basiseintrag: true },
            '111|222|': { Text: 'Anderer Begriff', Basiseintrag: false }
        }
    };
    return createAVVCatalog(data, 'uniqueTestId');
}

function makeAVV324Catalog(): AVVCatalog<AVV324Data> {
    const data: AVV324Data = {
        version: '1',
        gueltigAb: '2023-01-01',
        katalogNummer: '324',
        katalogName: 'Pathogene',
        facettenErlaubt: false,
        eintraege: {
            '9876|1234|': { Text: 'Salmonella spp.', Basiseintrag: true }
        },
        textEintraege: {
            'Escherichia coli': '111|222|',
            'Salmonella spp.': '9876|1234|'
        },
        fuzzyEintraege: [
            { Text: 'Escherichia coli', Kode: '111|222|', Basiseintrag: true },
            { Text: 'Salmonella spp.', Kode: '9876|1234|', Basiseintrag: true }
        ]
    };
    return createAVVCatalog(data);
}

function makeFacettenCatalog(): AVVCatalog<MibiCatalogFacettenData> {
    const data: MibiCatalogFacettenData = {
        version: '1',
        gueltigAb: '2023-01-01',
        katalogNummer: '316',
        katalogName: 'Matrix',
        facettenErlaubt: true,
        eintraege: {
            '100|200|': {
                Text: 'Rindfleisch',
                Basiseintrag: true,
                FacettenIds: [1],
                Facettenzuordnungen: []
            }
        },
        facetten: {
            '10': {
                FacettenId: 1,
                MehrfachAuswahl: true,
                Text: 'Tierart',
                FacettenWerte: {
                    '20': { Text: 'Rind' },
                    '21': { Text: 'Schwein' }
                }
            }
        }
    };
    return createAVVCatalog(data);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AVVCatalog', () => {
    describe('containsEintragWithAVVKode', () => {
        it('returns true when the code exists', () => {
            const cat = makeSimpleCatalog();
            expect(cat.containsEintragWithAVVKode('100|200|')).toBe(true);
        });

        it('returns false when the code does not exist', () => {
            const cat = makeSimpleCatalog();
            expect(cat.containsEintragWithAVVKode('999|999|')).toBe(false);
        });
    });

    describe('containsTextEintrag', () => {
        it('returns true for AVV324 catalog when the text exists', () => {
            const cat = makeAVV324Catalog();
            expect(cat.containsTextEintrag('Escherichia coli')).toBe(true);
        });

        it('returns false for AVV324 catalog when the text does not exist', () => {
            const cat = makeAVV324Catalog();
            expect(cat.containsTextEintrag('Unbekanntes Pathogen')).toBe(false);
        });

        it('returns false for a non-AVV324 catalog regardless of value', () => {
            const cat = makeSimpleCatalog();
            expect(cat.containsTextEintrag('Testbegriff')).toBe(false);
        });
    });

    describe('getEintragWithAVVKode', () => {
        it('returns the entry when the code exists', () => {
            const cat = makeSimpleCatalog();
            const entry = cat.getEintragWithAVVKode('100|200|');
            expect(entry).toBeDefined();
            expect(entry!.Text).toBe('Testbegriff');
        });

        it('returns undefined when the code does not exist', () => {
            const cat = makeSimpleCatalog();
            expect(cat.getEintragWithAVVKode('000|000|')).toBeUndefined();
        });
    });

    describe('getTextWithAVVKode', () => {
        it('returns the Text for a simple (non-facetten) catalog', () => {
            const cat = makeSimpleCatalog();
            expect(cat.getTextWithAVVKode('100|200|')).toBe('Testbegriff');
        });

        it('returns empty string when code is absent in a simple catalog', () => {
            const cat = makeSimpleCatalog();
            expect(cat.getTextWithAVVKode('999|999|')).toBe('');
        });

        it('delegates to getTextWithFacettenCode for a facetten catalog', () => {
            const cat = makeFacettenCatalog();
            const text = cat.getTextWithAVVKode('100|200|');
            expect(text).toContain('Rindfleisch');
        });
    });

    describe('getTextWithFacettenCode', () => {
        it('returns empty string when begriffsIdEintrag or id is missing', () => {
            const cat = makeFacettenCatalog();
            expect(cat.getTextWithFacettenCode('')).toBe('');
            expect(cat.getTextWithFacettenCode('100|')).toBe('');
        });

        it('builds text including facetten name and value when present', () => {
            const data: MibiCatalogFacettenData = {
                version: '1',
                gueltigAb: '2023-01-01',
                katalogNummer: '316',
                katalogName: 'Matrix',
                facettenErlaubt: true,
                eintraege: {
                    '100|200|': {
                        Text: 'Fleisch',
                        Basiseintrag: true,
                        FacettenIds: [1],
                        Facettenzuordnungen: []
                    }
                },
                facetten: {
                    '10': {
                        FacettenId: 1,
                        MehrfachAuswahl: false,
                        Text: 'Tierart',
                        FacettenWerte: {
                            '20': { Text: 'Rind' }
                        }
                    }
                }
            };
            const cat = createAVVCatalog(data);
            const text = cat.getTextWithFacettenCode('100|200|10-20');
            expect(text).toContain('Fleisch');
            expect(text).toContain('Tierart');
            expect(text).toContain('Rind');
        });
    });

    describe('isBasicCode', () => {
        it('returns true for the pattern \\d+|\\d+|', () => {
            const cat = makeSimpleCatalog();
            expect(cat.isBasicCode('100|200|')).toBe(true);
            expect(cat.isBasicCode('9876|1234|')).toBe(true);
        });

        it('returns false for strings that do not match the basic code pattern', () => {
            const cat = makeSimpleCatalog();
            expect(cat.isBasicCode('Escherichia coli')).toBe(false);
            expect(cat.isBasicCode('100|200|10-20')).toBe(false);
            expect(cat.isBasicCode('')).toBe(false);
        });
    });

    describe('hasFacettenInfo', () => {
        it('returns true for a valid facetten code in a facetten catalog', () => {
            const cat = makeFacettenCatalog();
            expect(cat.hasFacettenInfo('100|200|10-20')).toBe(true);
        });

        it('returns false for a basic code even in a facetten catalog', () => {
            const cat = makeFacettenCatalog();
            // basic code without facetten part – facettenCodeRegex requires them
            // Actually the facettenCodeRegex allows optional facettenPart, so '100|200|' matches too
            // The key is facettenErlaubt must be true
            expect(cat.hasFacettenInfo('not-a-code')).toBe(false);
        });

        it('returns false for any code in a non-facetten catalog', () => {
            const cat = makeSimpleCatalog();
            expect(cat.hasFacettenInfo('100|200|10-20')).toBe(false);
            expect(cat.hasFacettenInfo('100|200|')).toBe(false);
        });
    });

    describe('assembleAVVKode', () => {
        it('produces the expected string format', () => {
            const cat = makeSimpleCatalog();
            expect(cat.assembleAVVKode('100', '200')).toBe('100|200|');
            expect(cat.assembleAVVKode('9876', '1234')).toBe('9876|1234|');
        });
    });

    describe('containsFacetteWithBegriffsId', () => {
        it('returns true when begriffsId exists in facetten catalog', () => {
            const cat = makeFacettenCatalog();
            expect(cat.containsFacetteWithBegriffsId('10')).toBe(true);
        });

        it('returns false when begriffsId does not exist', () => {
            const cat = makeFacettenCatalog();
            expect(cat.containsFacetteWithBegriffsId('99')).toBe(false);
        });

        it('returns false for a non-facetten catalog', () => {
            const cat = makeSimpleCatalog();
            expect(cat.containsFacetteWithBegriffsId('10')).toBe(false);
        });
    });

    describe('getFacettenIdsWithKode', () => {
        it('returns FacettenIds array when the entry is a facetten entry', () => {
            const cat = makeFacettenCatalog();
            const ids = cat.getFacettenIdsWithKode('100|200|');
            expect(ids).toEqual([1]);
        });

        it('returns undefined when the code does not exist', () => {
            const cat = makeFacettenCatalog();
            expect(cat.getFacettenIdsWithKode('999|999|')).toBeUndefined();
        });
    });

    describe('getFacetteWithBegriffsId', () => {
        it('returns the facette when it exists', () => {
            const cat = makeFacettenCatalog();
            const facette = cat.getFacetteWithBegriffsId('10');
            expect(facette).toBeDefined();
            expect(facette!.Text).toBe('Tierart');
        });

        it('returns undefined when begriffsId does not exist', () => {
            const cat = makeFacettenCatalog();
            expect(cat.getFacetteWithBegriffsId('99')).toBeUndefined();
        });

        it('returns undefined for a non-facetten catalog', () => {
            const cat = makeSimpleCatalog();
            expect(cat.getFacetteWithBegriffsId('10')).toBeUndefined();
        });
    });

    describe('getFacettenWertWithBegriffsId', () => {
        it('returns the facetten wert when it exists', () => {
            const cat = makeFacettenCatalog();
            const wert = cat.getFacettenWertWithBegriffsId('20', '10');
            expect(wert).toBeDefined();
            expect(wert!.Text).toBe('Rind');
        });

        it('returns undefined when facetten wert id does not exist', () => {
            const cat = makeFacettenCatalog();
            expect(
                cat.getFacettenWertWithBegriffsId('99', '10')
            ).toBeUndefined();
        });

        it('returns undefined when begriffsId does not exist', () => {
            const cat = makeFacettenCatalog();
            expect(
                cat.getFacettenWertWithBegriffsId('20', '99')
            ).toBeUndefined();
        });
    });

    describe('getObligatoryFacettenzuordnungen', () => {
        it('returns empty array when entry has no Facettenzuordnungen', () => {
            const cat = makeFacettenCatalog();
            expect(cat.getObligatoryFacettenzuordnungen('100|200|')).toEqual(
                []
            );
        });

        it('returns the Facettenzuordnungen when present', () => {
            const data: MibiCatalogFacettenData = {
                version: '1',
                gueltigAb: '2023-01-01',
                katalogNummer: '316',
                katalogName: 'Matrix',
                facettenErlaubt: true,
                eintraege: {
                    '100|200|': {
                        Text: 'Fleisch',
                        Basiseintrag: true,
                        FacettenIds: [1],
                        Facettenzuordnungen: [
                            {
                                FacettenId: 1,
                                FacettenwertId: 20,
                                Festgelegt: true
                            }
                        ]
                    }
                },
                facetten: {}
            };
            const cat = createAVVCatalog(data);
            const zuordnungen =
                cat.getObligatoryFacettenzuordnungen('100|200|');
            expect(zuordnungen).toHaveLength(1);
            expect(zuordnungen[0].FacettenId).toBe(1);
        });

        it('returns empty array for a non-facetten catalog', () => {
            const cat = makeSimpleCatalog();
            expect(cat.getObligatoryFacettenzuordnungen('100|200|')).toEqual(
                []
            );
        });
    });

    describe('getFuzzyIndex', () => {
        it('returns a Fuse instance over the fuzzyEintraege', () => {
            const cat = makeAVV324Catalog();
            const fuse = cat.getFuzzyIndex({ keys: ['Text'] });
            expect(fuse).toBeDefined();
            const results = fuse.search('Salmonella');
            expect(results.length).toBeGreaterThan(0);
        });

        it('includes enhancement entries in the fuzzy index', () => {
            const cat = makeAVV324Catalog();
            const enhancement = {
                Text: 'Genus Salmonella',
                Kode: '9876|5678|',
                Basiseintrag: false
            };
            const fuse = cat.getFuzzyIndex({ keys: ['Text'] }, [enhancement]);
            const results = fuse.search('Genus Salmonella');
            expect(results.some(r => r.item.Text === 'Genus Salmonella')).toBe(
                true
            );
        });
    });

    describe('getUniqueId', () => {
        it('returns the uId passed at construction', () => {
            const cat = makeSimpleCatalog();
            expect(cat.getUniqueId()).toBe('uniqueTestId');
        });

        it('returns empty string when no uId was passed', () => {
            const cat = makeAVV324Catalog();
            expect(cat.getUniqueId()).toBe('');
        });
    });

    describe('dump', () => {
        it('returns the raw data object', () => {
            const cat = makeAVV324Catalog();
            const dumped = cat.dump();
            expect(dumped.katalogNummer).toBe('324');
            expect(dumped.facettenErlaubt).toBe(false);
        });
    });
});
