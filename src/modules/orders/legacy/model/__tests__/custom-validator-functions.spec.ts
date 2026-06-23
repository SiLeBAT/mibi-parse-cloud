import moment from 'moment';
import { NRL_ID_VALUE } from '../../../../shared/domain/valueObjects';
import { AVVCatalog, createAVVCatalog } from '../avvcatalog.entity';
import {
    AVV324Data,
    CodeType,
    MibiCatalogFacettenData,
    ZOMO_ID,
    ZomoData
} from '../legacy.model';
import {
    atLeastOneOf,
    dateAllowEmpty,
    dependentFields,
    hasCorrectSequenceStatusValues,
    hasObligatoryFacettenValues,
    inAVVCatalog,
    inAVVFacettenCatalog,
    inPLZCatalog,
    isHierarchyCode,
    matchAVVCodeOrString,
    matchesProgramZoMo,
    matchesIdToSpecificYear,
    matchesRegexPattern,
    matchesZoMo,
    multipleFacettenAllowed,
    noPlanprobeForNRL_AR,
    notEmptyIfOtherExists,
    nrlExists,
    presenceNotZoMo,
    presenceZoMo,
    referenceDate,
    requiredIfOther
} from '../custom-validator-functions';

// ---------------------------------------------------------------------------
// Shared test error message object
// ---------------------------------------------------------------------------

const TEST_ERROR = { code: 99, level: 2, message: 'Test validation error' };
const BASE_OPTIONS = { message: TEST_ERROR };

// ---------------------------------------------------------------------------
// Minimal catalog service mock factory
// ---------------------------------------------------------------------------

function makeAvv324Data(): AVV324Data {
    return {
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
}

function makeFacettenCatalogData(): MibiCatalogFacettenData {
    return {
        version: '1',
        gueltigAb: '2023-01-01',
        katalogNummer: '316',
        katalogName: 'Facetten',
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
                MehrfachAuswahl: false,
                Text: 'Tierart',
                FacettenWerte: {
                    '20': { Text: 'Rind' },
                    '21': { Text: 'Schwein' }
                }
            }
        }
    };
}

function makeMockCatalogService(avvCatalog: AVVCatalog<any>) {
    return {
        getAVVCatalog: jest.fn().mockReturnValue(avvCatalog),
        getPLZCatalog: jest.fn(),
        getCatalogSearchAliases: jest.fn().mockReturnValue([]),
        getZomoPlan: jest.fn().mockReturnValue(null)
    };
}

// ---------------------------------------------------------------------------
// nrlExists
// ---------------------------------------------------------------------------

describe('nrlExists', () => {
    it('returns error when nrl is UNKNOWN', () => {
        const result = nrlExists('', BASE_OPTIONS, 'sample_id', {
            nrl: NRL_ID_VALUE.UNKNOWN
        });
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns null when nrl is a known NRL value', () => {
        const result = nrlExists('', BASE_OPTIONS, 'sample_id', {
            nrl: NRL_ID_VALUE.NRL_AR
        });
        expect(result).toBeNull();
    });

    it('returns null for each known NRL value', () => {
        const knownValues = Object.values(NRL_ID_VALUE).filter(
            v => v !== NRL_ID_VALUE.UNKNOWN
        );
        knownValues.forEach(nrl => {
            expect(
                nrlExists('', BASE_OPTIONS, 'sample_id', { nrl })
            ).toBeNull();
        });
    });
});

// ---------------------------------------------------------------------------
// noPlanprobeForNRL_AR
// ---------------------------------------------------------------------------

describe('noPlanprobeForNRL_AR', () => {
    const PLANPROBEN_CODE = '22562|126354|';

    it('returns error when NRL is NRL_AR, value is planproben code and control_program_avv is NOT ZoMo code', () => {
        const result = noPlanprobeForNRL_AR(
            PLANPROBEN_CODE,
            BASE_OPTIONS,
            'sampling_reason_avv',
            {
                nrl: NRL_ID_VALUE.NRL_AR,
                control_program_avv: 'some-other-code'
            }
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns null when NRL is not NRL_AR', () => {
        const result = noPlanprobeForNRL_AR(
            PLANPROBEN_CODE,
            BASE_OPTIONS,
            'sampling_reason_avv',
            {
                nrl: NRL_ID_VALUE.NRL_Salm,
                control_program_avv: 'some-other-code'
            }
        );
        expect(result).toBeNull();
    });

    it('returns null when value is not the planproben code', () => {
        const result = noPlanprobeForNRL_AR(
            'different-code',
            BASE_OPTIONS,
            'sampling_reason_avv',
            {
                nrl: NRL_ID_VALUE.NRL_AR,
                control_program_avv: 'some-other-code'
            }
        );
        expect(result).toBeNull();
    });

    it('returns null when control_program_avv IS the ZoMo code (exception)', () => {
        const result = noPlanprobeForNRL_AR(
            PLANPROBEN_CODE,
            BASE_OPTIONS,
            'sampling_reason_avv',
            {
                nrl: NRL_ID_VALUE.NRL_AR,
                control_program_avv: ZOMO_ID.code
            }
        );
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// requiredIfOther
// ---------------------------------------------------------------------------

describe('requiredIfOther', () => {
    const opts = {
        ...BASE_OPTIONS,
        field: 'operations_mode_avv',
        regex: '^10469'
    };

    it('returns error when referenced field matches regex and current field is empty', () => {
        const attrs: Record<string, string> = {
            operations_mode_avv: '10469|57619|',
            operations_mode_text: ''
        };
        const result = requiredIfOther('', opts, 'operations_mode_text', attrs);
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns null when referenced field does not match regex', () => {
        const attrs: Record<string, string> = {
            operations_mode_avv: '99999|00000|',
            operations_mode_text: ''
        };
        const result = requiredIfOther('', opts, 'operations_mode_text', attrs);
        expect(result).toBeNull();
    });

    it('returns null when current field is non-empty even if other field matches', () => {
        const attrs: Record<string, string> = {
            operations_mode_avv: '10469|57619|',
            operations_mode_text: 'Einzelhandel'
        };
        const result = requiredIfOther(
            'Einzelhandel',
            opts,
            'operations_mode_text',
            attrs
        );
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// matchesRegexPattern
// ---------------------------------------------------------------------------

describe('matchesRegexPattern', () => {
    it('returns null for empty value', () => {
        const result = matchesRegexPattern('', {
            ...BASE_OPTIONS,
            regex: ['^\\d+$'],
            ignoreNumbers: false
        });
        expect(result).toBeNull();
    });

    it('returns null when value matches one of the regexes', () => {
        const result = matchesRegexPattern('12345', {
            ...BASE_OPTIONS,
            regex: ['^\\d+$', '^[A-Z]+$'],
            ignoreNumbers: false
        });
        expect(result).toBeNull();
    });

    it('returns error when value matches none of the regexes', () => {
        const result = matchesRegexPattern('abc', {
            ...BASE_OPTIONS,
            regex: ['^\\d+$'],
            ignoreNumbers: false
        });
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns null when ignoreNumbers is true and value is all digits', () => {
        const result = matchesRegexPattern('99999', {
            ...BASE_OPTIONS,
            regex: ['^[A-Z]+$'],
            ignoreNumbers: true
        });
        expect(result).toBeNull();
    });

    it('does NOT ignore digits when ignoreNumbers is false', () => {
        const result = matchesRegexPattern('99999', {
            ...BASE_OPTIONS,
            regex: ['^[A-Z]+$'],
            ignoreNumbers: false
        });
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns null when value matches case-insensitively with caseInsensitive flag', () => {
        const result = matchesRegexPattern('escherichia', {
            ...BASE_OPTIONS,
            regex: ['^Escherichia$'],
            ignoreNumbers: false,
            caseInsensitive: true
        });
        expect(result).toBeNull();
    });

    it('returns error when case-insensitive flag is off and case does not match', () => {
        const result = matchesRegexPattern('escherichia', {
            ...BASE_OPTIONS,
            regex: ['^Escherichia$'],
            ignoreNumbers: false,
            caseInsensitive: false
        });
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns null when regex array is empty', () => {
        const result = matchesRegexPattern('anything', {
            ...BASE_OPTIONS,
            regex: [],
            ignoreNumbers: false
        });
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// matchesIdToSpecificYear
// ---------------------------------------------------------------------------

describe('matchesIdToSpecificYear', () => {
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;
    const nextYear = currentYear + 1;

    it('returns null for empty value', () => {
        const result = matchesIdToSpecificYear(
            '',
            { ...BASE_OPTIONS, regex: ['^\\d{2}-L-\\d{5}-\\d{1}-\\d{1}$'] },
            'sample_id_avv',
            {}
        );
        expect(result).toBeNull();
    });

    it('returns null when value matches the current year yyyy placeholder', () => {
        const id = `${currentYear}-L-00001-1-1`;
        const result = matchesIdToSpecificYear(
            id,
            { ...BASE_OPTIONS, regex: ['yyyy-L-\\d{5}-\\d{1}-\\d{1}'] },
            'sample_id_avv',
            {}
        );
        expect(result).toBeNull();
    });

    it('returns null when value matches the previous year', () => {
        const id = `${prevYear}-L-00001-1-1`;
        const result = matchesIdToSpecificYear(
            id,
            { ...BASE_OPTIONS, regex: ['yyyy-L-\\d{5}-\\d{1}-\\d{1}'] },
            'sample_id_avv',
            {}
        );
        expect(result).toBeNull();
    });

    it('returns null when value matches the next year', () => {
        const id = `${nextYear}-L-00001-1-1`;
        const result = matchesIdToSpecificYear(
            id,
            { ...BASE_OPTIONS, regex: ['yyyy-L-\\d{5}-\\d{1}-\\d{1}'] },
            'sample_id_avv',
            {}
        );
        expect(result).toBeNull();
    });

    it('returns error when value does not match any of the three year variants', () => {
        const id = `${currentYear - 5}-L-00001-1-1`;
        const result = matchesIdToSpecificYear(
            id,
            { ...BASE_OPTIONS, regex: ['yyyy-L-\\d{5}-\\d{1}-\\d{1}'] },
            'sample_id_avv',
            {}
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('uses sampling_date from attributes when provided', () => {
        const samplingYear = 2022;
        const id = `${samplingYear}-L-00001-1-1`;
        const result = matchesIdToSpecificYear(
            id,
            { ...BASE_OPTIONS, regex: ['yyyy-L-\\d{5}-\\d{1}-\\d{1}'] },
            'sample_id_avv',
            { sampling_date: '15.06.2022' }
        );
        expect(result).toBeNull();
    });

    it('replaces yy placeholder with 2-digit year', () => {
        const twoDigitYear = String(currentYear).slice(-2);
        const id = `${twoDigitYear}-L-00001`;
        const result = matchesIdToSpecificYear(
            id,
            { ...BASE_OPTIONS, regex: ['yy-L-\\d{5}'] },
            'sample_id_avv',
            {}
        );
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// referenceDate
// ---------------------------------------------------------------------------

describe('referenceDate', () => {
    it('returns null when isolation date is after sampling date (earliest option)', () => {
        const result = referenceDate(
            '15-03-2024',
            { ...BASE_OPTIONS, earliest: 'sampling_date' },
            'isolation_date',
            { sampling_date: '01-03-2024' }
        );
        expect(result).toBeNull();
    });

    it('returns error when isolation date is before sampling date (earliest option)', () => {
        const result = referenceDate(
            '01-03-2024',
            { ...BASE_OPTIONS, earliest: 'sampling_date' },
            'isolation_date',
            { sampling_date: '15-03-2024' }
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns null when both dates are the same (earliest)', () => {
        const result = referenceDate(
            '01-03-2024',
            { ...BASE_OPTIONS, earliest: 'sampling_date' },
            'isolation_date',
            { sampling_date: '01-03-2024' }
        );
        expect(result).toBeNull();
    });

    it('returns null when value is not a valid date', () => {
        const result = referenceDate(
            'not-a-date',
            { ...BASE_OPTIONS, earliest: 'sampling_date' },
            'isolation_date',
            { sampling_date: '01-03-2024' }
        );
        expect(result).toBeNull();
    });

    it('uses NOW as reference when referenceDateId is "NOW"', () => {
        const tomorrow = moment().add(1, 'day').format('DD-MM-YYYY');
        const result = referenceDate(
            tomorrow,
            { ...BASE_OPTIONS, earliest: 'NOW' },
            'some_date',
            {}
        );
        expect(result).toBeNull();
    });

    it('applies modifier when provided with earliest option', () => {
        // Sampling date 10-03-2024 + modifier -1 year → reference is 10-03-2023
        // Isolation date 15-06-2023 → after 10-03-2023 → valid
        const result = referenceDate(
            '15-06-2023',
            {
                ...BASE_OPTIONS,
                earliest: 'sampling_date',
                modifier: { value: 1, unit: 'year' }
            },
            'isolation_date',
            { sampling_date: '10-03-2024' }
        );
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// atLeastOneOf
// ---------------------------------------------------------------------------

describe('atLeastOneOf', () => {
    it('returns null when the current field (key) itself is non-empty', () => {
        const result = atLeastOneOf(
            'some value',
            { ...BASE_OPTIONS, additionalMembers: ['field_b'] },
            'field_a',
            { field_a: 'some value', field_b: '' }
        );
        expect(result).toBeNull();
    });

    it('returns null when current field is empty but an additional member is non-empty', () => {
        const result = atLeastOneOf(
            '',
            { ...BASE_OPTIONS, additionalMembers: ['field_b', 'field_c'] },
            'field_a',
            { field_a: '', field_b: 'non-empty', field_c: '' }
        );
        expect(result).toBeNull();
    });

    it('returns error when current field AND all additional members are empty', () => {
        const result = atLeastOneOf(
            '',
            { ...BASE_OPTIONS, additionalMembers: ['field_b', 'field_c'] },
            'field_a',
            { field_a: '', field_b: '', field_c: '' }
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns error when additionalMembers is empty and current field is empty', () => {
        const result = atLeastOneOf(
            '',
            { ...BASE_OPTIONS, additionalMembers: [] },
            'field_a',
            { field_a: '' }
        );
        expect(result).toEqual(TEST_ERROR);
    });
});

// ---------------------------------------------------------------------------
// dependentFields
// ---------------------------------------------------------------------------

describe('dependentFields', () => {
    it('returns null when the current field is empty (no dependency to check)', () => {
        const result = dependentFields(
            '',
            { ...BASE_OPTIONS, dependents: ['field_b'] },
            'field_a',
            { field_a: '' }
        );
        expect(result).toBeNull();
    });

    it('returns null when current field is non-empty and all dependents are also non-empty', () => {
        const result = dependentFields(
            'filled',
            { ...BASE_OPTIONS, dependents: ['field_b', 'field_c'] },
            'field_a',
            {
                field_a: 'filled',
                field_b: 'also filled',
                field_c: 'also filled'
            }
        );
        expect(result).toBeNull();
    });

    it('returns error when current field is non-empty but a dependent is empty', () => {
        const result = dependentFields(
            'filled',
            { ...BASE_OPTIONS, dependents: ['field_b'] },
            'field_a',
            { field_a: 'filled', field_b: '' }
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns error on the first missing dependent even if others are present', () => {
        const result = dependentFields(
            'filled',
            { ...BASE_OPTIONS, dependents: ['field_b', 'field_c'] },
            'field_a',
            { field_a: 'filled', field_b: '', field_c: 'present' }
        );
        expect(result).toEqual(TEST_ERROR);
    });
});

// ---------------------------------------------------------------------------
// dateAllowEmpty
// ---------------------------------------------------------------------------

describe('dateAllowEmpty', () => {
    it('returns null for empty value', () => {
        const result = dateAllowEmpty('', BASE_OPTIONS as any);
        expect(result).toBeNull();
    });

    it('returns null for a valid date in DD.MM.YYYY format', () => {
        const result = dateAllowEmpty('15.03.2024', BASE_OPTIONS as any);
        expect(result).toBeNull();
    });

    it('returns null for a valid date in D.M.YYYY format', () => {
        const result = dateAllowEmpty('5.3.2024', BASE_OPTIONS as any);
        expect(result).toBeNull();
    });

    it('returns error for an invalid date string', () => {
        const result = dateAllowEmpty('not-a-date', BASE_OPTIONS as any);
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns error for wrong format (YYYY-MM-DD)', () => {
        const result = dateAllowEmpty('2024-03-15', BASE_OPTIONS as any);
        expect(result).toEqual(TEST_ERROR);
    });
});

// ---------------------------------------------------------------------------
// inAVVCatalog (curried)
// ---------------------------------------------------------------------------

describe('inAVVCatalog', () => {
    it('returns null when field is empty (no validation needed)', () => {
        const avvCat = createAVVCatalog(makeAvv324Data());
        const svc = makeMockCatalogService(avvCat);
        const validator = inAVVCatalog(svc as any);
        const result = validator(
            '',
            { ...BASE_OPTIONS, catalog: 'avv324', key: 'pathogen_avv' },
            'pathogen_avv',
            { pathogen_avv: '', sampling_date: '' }
        );
        expect(result).toBeNull();
    });

    it('returns null when value is a valid AVV code in the catalog', () => {
        const avvCat = createAVVCatalog(makeAvv324Data());
        const svc = makeMockCatalogService(avvCat);
        const validator = inAVVCatalog(svc as any);
        const result = validator(
            '9876|1234|',
            { ...BASE_OPTIONS, catalog: 'avv324', key: 'pathogen_avv' },
            'pathogen_avv',
            { pathogen_avv: '9876|1234|', sampling_date: '' }
        );
        expect(result).toBeNull();
    });

    it('returns null when value is a valid text entry in the catalog', () => {
        const avvCat = createAVVCatalog(makeAvv324Data());
        const svc = makeMockCatalogService(avvCat);
        const validator = inAVVCatalog(svc as any);
        const result = validator(
            'Escherichia coli',
            { ...BASE_OPTIONS, catalog: 'avv324', key: 'pathogen_avv' },
            'pathogen_avv',
            { pathogen_avv: 'Escherichia coli', sampling_date: '' }
        );
        expect(result).toBeNull();
    });

    it('returns error when value is not found in any catalog', () => {
        const avvCat = createAVVCatalog(makeAvv324Data());
        const svc = makeMockCatalogService(avvCat);
        const validator = inAVVCatalog(svc as any);
        const result = validator(
            'Unbekanntes Pathogen',
            { ...BASE_OPTIONS, catalog: 'avv324', key: 'pathogen_avv' },
            'pathogen_avv',
            { pathogen_avv: 'Unbekanntes Pathogen', sampling_date: '' }
        );
        expect(result).toEqual(TEST_ERROR);
    });
});

// ---------------------------------------------------------------------------
// matchAVVCodeOrString (curried)
// ---------------------------------------------------------------------------

describe('matchAVVCodeOrString', () => {
    it('returns null when field is empty', () => {
        const avvCat = createAVVCatalog(makeAvv324Data());
        const svc = makeMockCatalogService(avvCat);
        const validator = matchAVVCodeOrString(svc as any);
        const result = validator(
            '',
            {
                ...BASE_OPTIONS,
                catalog: 'avv324',
                key: 'pathogen_avv',
                alternateKey: ''
            } as any,
            'pathogen_avv',
            { pathogen_avv: '', sampling_date: '' }
        );
        expect(result).toBeNull();
    });

    it('returns null for a valid AVV code present in the catalog', () => {
        const avvCat = createAVVCatalog(makeAvv324Data());
        const svc = makeMockCatalogService(avvCat);
        const validator = matchAVVCodeOrString(svc as any);
        const result = validator(
            '9876|1234|',
            {
                ...BASE_OPTIONS,
                catalog: 'avv324',
                key: 'pathogen_avv',
                alternateKey: ''
            } as any,
            'pathogen_avv',
            { pathogen_avv: '9876|1234|', sampling_date: '' }
        );
        expect(result).toBeNull();
    });

    it('returns error for an AVV code that is NOT in the catalog', () => {
        const avvCat = createAVVCatalog(makeAvv324Data());
        const svc = makeMockCatalogService(avvCat);
        const validator = matchAVVCodeOrString(svc as any);
        const result = validator(
            '0000|0000|',
            {
                ...BASE_OPTIONS,
                catalog: 'avv324',
                key: 'pathogen_avv',
                alternateKey: ''
            } as any,
            'pathogen_avv',
            { pathogen_avv: '0000|0000|', sampling_date: '' }
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns null for a valid text entry when alternateKey is "Text"', () => {
        const avvCat = createAVVCatalog(makeAvv324Data());
        const svc = makeMockCatalogService(avvCat);
        const validator = matchAVVCodeOrString(svc as any);
        const result = validator(
            'Escherichia coli',
            {
                ...BASE_OPTIONS,
                catalog: 'avv324',
                key: 'pathogen_avv',
                alternateKey: 'Text'
            } as any,
            'pathogen_avv',
            { pathogen_avv: 'Escherichia coli', sampling_date: '' }
        );
        expect(result).toBeNull();
    });

    it('returns error for a plain string that is not a text entry when alternateKey is "Text"', () => {
        const avvCat = createAVVCatalog(makeAvv324Data());
        const svc = makeMockCatalogService(avvCat);
        const validator = matchAVVCodeOrString(svc as any);
        const result = validator(
            'Unknown pathogen text',
            {
                ...BASE_OPTIONS,
                catalog: 'avv324',
                key: 'pathogen_avv',
                alternateKey: 'Text'
            } as any,
            'pathogen_avv',
            { pathogen_avv: 'Unknown pathogen text', sampling_date: '' }
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns null for a non-catalog text when the pathogen is relevant for a BfR lab (nrl assigned)', () => {
        const avvCat = createAVVCatalog(makeAvv324Data());
        const svc = makeMockCatalogService(avvCat);
        const validator = matchAVVCodeOrString(svc as any);
        const result = validator(
            'BfR pathogen not in catalog',
            {
                ...BASE_OPTIONS,
                catalog: 'avv324',
                key: 'pathogen_avv',
                alternateKey: 'Text'
            } as any,
            'pathogen_avv',
            {
                pathogen_avv: 'BfR pathogen not in catalog',
                sampling_date: '',
                // nrl was assigned from a current NRL selector match
                nrl: NRL_ID_VALUE.NRL_AR
            } as any
        );
        expect(result).toBeNull();
    });

    it('returns error for a non-catalog text when no NRL was assigned (nrl UNKNOWN)', () => {
        const avvCat = createAVVCatalog(makeAvv324Data());
        const svc = makeMockCatalogService(avvCat);
        const validator = matchAVVCodeOrString(svc as any);
        const result = validator(
            'BfR pathogen not in catalog',
            {
                ...BASE_OPTIONS,
                catalog: 'avv324',
                key: 'pathogen_avv',
                alternateKey: 'Text'
            } as any,
            'pathogen_avv',
            {
                pathogen_avv: 'BfR pathogen not in catalog',
                sampling_date: '',
                nrl: NRL_ID_VALUE.UNKNOWN
            } as any
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns error for a plain string that is not an AVV code and alternateKey is empty', () => {
        const avvCat = createAVVCatalog(makeAvv324Data());
        const svc = makeMockCatalogService(avvCat);
        const validator = matchAVVCodeOrString(svc as any);
        const result = validator(
            'just text',
            {
                ...BASE_OPTIONS,
                catalog: 'avv324',
                key: 'pathogen_avv',
                alternateKey: ''
            } as any,
            'pathogen_avv',
            { pathogen_avv: 'just text', sampling_date: '' }
        );
        expect(result).toEqual(TEST_ERROR);
    });
});

// ---------------------------------------------------------------------------
// inAVVFacettenCatalog (curried)
// ---------------------------------------------------------------------------

describe('inAVVFacettenCatalog', () => {
    it('returns null when field is empty', () => {
        const facettenCat = createAVVCatalog(makeFacettenCatalogData());
        const svc = makeMockCatalogService(facettenCat);
        const validator = inAVVFacettenCatalog(svc as any);
        const result = validator(
            '',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '', sampling_date: '' }
        );
        expect(result).toBeNull();
    });

    it('returns null for a valid basic AVV code in the facetten catalog', () => {
        const facettenCat = createAVVCatalog(makeFacettenCatalogData());
        const svc = makeMockCatalogService(facettenCat);
        const validator = inAVVFacettenCatalog(svc as any);
        const result = validator(
            '100|200|',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '100|200|', sampling_date: '' }
        );
        expect(result).toBeNull();
    });

    it('returns error for a code whose begriffsId or id part is missing', () => {
        const facettenCat = createAVVCatalog(makeFacettenCatalogData());
        const svc = makeMockCatalogService(facettenCat);
        const validator = inAVVFacettenCatalog(svc as any);
        const result = validator(
            'noPipeHere',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: 'noPipeHere', sampling_date: '' }
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns null for a valid facetten code with valid facette and wert', () => {
        const facettenCat = createAVVCatalog(makeFacettenCatalogData());
        const svc = makeMockCatalogService(facettenCat);
        const validator = inAVVFacettenCatalog(svc as any);
        const result = validator(
            '100|200|10-20',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '100|200|10-20', sampling_date: '' }
        );
        expect(result).toBeNull();
    });

    it('returns error when facetten wert is not found', () => {
        const facettenCat = createAVVCatalog(makeFacettenCatalogData());
        const svc = makeMockCatalogService(facettenCat);
        const validator = inAVVFacettenCatalog(svc as any);
        const result = validator(
            '100|200|10-99',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '100|200|10-99', sampling_date: '' }
        );
        expect(result).toEqual(TEST_ERROR);
    });
});

// ---------------------------------------------------------------------------
// notEmptyIfOtherExists
// ---------------------------------------------------------------------------

describe('notEmptyIfOtherExists', () => {
    it('returns null when current value is non-empty', () => {
        const result = notEmptyIfOtherExists(
            'some value',
            { ...BASE_OPTIONS, other: 'sequence_status' },
            'sequence_id',
            { sequence_id: 'some value', sequence_status: 'QC-PASS' }
        );
        expect(result).toBeNull();
    });

    it('returns error when current value is empty and other value is QC-PASS', () => {
        const result = notEmptyIfOtherExists(
            '',
            { ...BASE_OPTIONS, other: 'sequence_status' },
            'sequence_id',
            { sequence_id: '', sequence_status: 'QC-PASS' }
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns error when current value is empty and other value is QC-FAIL', () => {
        const result = notEmptyIfOtherExists(
            '',
            { ...BASE_OPTIONS, other: 'sequence_status' },
            'sequence_id',
            { sequence_id: '', sequence_status: 'qc-fail' }
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns null when current value is empty but other is not QC pattern', () => {
        const result = notEmptyIfOtherExists(
            '',
            { ...BASE_OPTIONS, other: 'sequence_status' },
            'sequence_id',
            { sequence_id: '', sequence_status: 'in Bearbeitung' }
        );
        expect(result).toBeNull();
    });

    it('returns null when key is not in attributes', () => {
        const result = notEmptyIfOtherExists(
            '',
            { ...BASE_OPTIONS, other: 'sequence_status' },
            'missing_field' as any,
            { sequence_status: 'QC-PASS' }
        );
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// hasCorrectSequenceStatusValues
// ---------------------------------------------------------------------------

describe('hasCorrectSequenceStatusValues', () => {
    it('returns null for empty value', () => {
        const result = hasCorrectSequenceStatusValues(
            '',
            BASE_OPTIONS,
            'sequence_status',
            { sequence_status: '' }
        );
        expect(result).toBeNull();
    });

    it('returns null for valid "QC-PASS"', () => {
        const result = hasCorrectSequenceStatusValues(
            'QC-PASS',
            BASE_OPTIONS,
            'sequence_status',
            { sequence_status: 'QC-PASS' }
        );
        expect(result).toBeNull();
    });

    it('returns null for valid "QC-FAIL"', () => {
        const result = hasCorrectSequenceStatusValues(
            'QC-FAIL',
            BASE_OPTIONS,
            'sequence_status',
            { sequence_status: 'QC-FAIL' }
        );
        expect(result).toBeNull();
    });

    it('returns null for valid "in Bearbeitung" (case-insensitive)', () => {
        const result = hasCorrectSequenceStatusValues(
            'in bearbeitung',
            BASE_OPTIONS,
            'sequence_status',
            { sequence_status: 'in bearbeitung' }
        );
        expect(result).toBeNull();
    });

    it('returns null for valid "in Planung"', () => {
        const result = hasCorrectSequenceStatusValues(
            'in Planung',
            BASE_OPTIONS,
            'sequence_status',
            { sequence_status: 'in Planung' }
        );
        expect(result).toBeNull();
    });

    it('returns error for an unrecognised value', () => {
        const result = hasCorrectSequenceStatusValues(
            'random status',
            BASE_OPTIONS,
            'sequence_status',
            { sequence_status: 'random status' }
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns null when key is absent from attributes', () => {
        const result = hasCorrectSequenceStatusValues(
            'bad',
            BASE_OPTIONS,
            'missing_field' as any,
            { sequence_status: 'bad' }
        );
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// inPLZCatalog (curried)
// ---------------------------------------------------------------------------

describe('inPLZCatalog', () => {
    function makePLZCatalogService(contains: boolean) {
        const cat = {
            getUniqueId: jest.fn().mockReturnValue('PLZ'),
            containsEntryWithKeyValue: jest.fn().mockReturnValue(contains)
        };
        return {
            getPLZCatalog: jest.fn().mockReturnValue(cat)
        };
    }

    it('returns null when field is empty', () => {
        const svc = makePLZCatalogService(false);
        const validator = inPLZCatalog(svc as any);
        const result = validator(
            '',
            { ...BASE_OPTIONS, catalog: 'plz', key: 'PLZ' },
            'sampling_location_zip',
            { sampling_location_zip: '' }
        );
        expect(result).toBeNull();
    });

    it('returns null when PLZ exists in catalog', () => {
        const svc = makePLZCatalogService(true);
        const validator = inPLZCatalog(svc as any);
        const result = validator(
            '10115',
            { ...BASE_OPTIONS, catalog: 'plz', key: 'PLZ' },
            'sampling_location_zip',
            { sampling_location_zip: '10115' }
        );
        expect(result).toBeNull();
    });

    it('returns error when PLZ is not found in catalog', () => {
        const svc = makePLZCatalogService(false);
        const validator = inPLZCatalog(svc as any);
        const result = validator(
            '99999',
            { ...BASE_OPTIONS, catalog: 'plz', key: 'PLZ' },
            'sampling_location_zip',
            { sampling_location_zip: '99999' }
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns error when getPLZCatalog returns null', () => {
        const svc = { getPLZCatalog: jest.fn().mockReturnValue(null) };
        const validator = inPLZCatalog(svc as any);
        const result = validator(
            '10115',
            { ...BASE_OPTIONS, catalog: 'plz', key: 'PLZ' },
            'sampling_location_zip',
            { sampling_location_zip: '10115' }
        );
        expect(result).toEqual(TEST_ERROR);
    });
});

// ---------------------------------------------------------------------------
// presenceZoMo
// ---------------------------------------------------------------------------

describe('presenceZoMo', () => {
    const ZOMO_ATTRS = {
        control_program_avv: ZOMO_ID.code,
        program_reason_text: ''
    };
    const NON_ZOMO_ATTRS = {
        control_program_avv: 'other',
        program_reason_text: 'nothing'
    };

    it('returns null when sample is NOT ZoMo (no presence required)', () => {
        const result = presenceZoMo(
            '',
            BASE_OPTIONS,
            'program_avv',
            NON_ZOMO_ATTRS as any
        );
        expect(result).toBeNull();
    });

    it('returns error when sample IS ZoMo and value is empty', () => {
        const result = presenceZoMo(
            '',
            BASE_OPTIONS,
            'program_avv',
            ZOMO_ATTRS as any
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns null when sample IS ZoMo and value is present', () => {
        const result = presenceZoMo(
            '10001|20002|',
            BASE_OPTIONS,
            'program_avv',
            ZOMO_ATTRS as any
        );
        expect(result).toBeNull();
    });

    it('returns error via program_reason_text ZoMo detection', () => {
        const attrs = {
            control_program_avv: 'other',
            program_reason_text: 'zoonose monitoring program'
        };
        const result = presenceZoMo(
            '',
            BASE_OPTIONS,
            'program_avv',
            attrs as any
        );
        expect(result).toEqual(TEST_ERROR);
    });
});

// ---------------------------------------------------------------------------
// presenceNotZoMo
// ---------------------------------------------------------------------------

describe('presenceNotZoMo', () => {
    const ZOMO_ATTRS = {
        control_program_avv: ZOMO_ID.code,
        program_reason_text: ''
    };
    const NON_ZOMO_ATTRS = {
        control_program_avv: 'other',
        program_reason_text: 'nothing'
    };

    it('returns null when sample IS ZoMo (not applicable)', () => {
        const result = presenceNotZoMo(
            '',
            BASE_OPTIONS,
            'program_avv',
            ZOMO_ATTRS as any
        );
        expect(result).toBeNull();
    });

    it('returns error when sample is NOT ZoMo and value is empty', () => {
        const result = presenceNotZoMo(
            '',
            BASE_OPTIONS,
            'program_avv',
            NON_ZOMO_ATTRS as any
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns null when sample is NOT ZoMo and value is present', () => {
        const result = presenceNotZoMo(
            'some value',
            BASE_OPTIONS,
            'program_avv',
            NON_ZOMO_ATTRS as any
        );
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// isHierarchyCode (curried)
// ---------------------------------------------------------------------------

describe('isHierarchyCode', () => {
    it('returns null when field is empty', () => {
        const facettenCat = createAVVCatalog(makeFacettenCatalogData());
        const svc = makeMockCatalogService(facettenCat);
        const validator = isHierarchyCode(svc as any);
        const result = validator(
            '',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '' }
        );
        expect(result).toBeNull();
    });

    it('returns null for a basic code (Basiseintrag=true)', () => {
        const facettenCat = createAVVCatalog(makeFacettenCatalogData());
        const svc = makeMockCatalogService(facettenCat);
        const validator = isHierarchyCode(svc as any);
        const result = validator(
            '100|200|',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '100|200|', sampling_date: '' }
        );
        expect(result).toBeNull();
    });

    it('returns null when code contains facetten values', () => {
        const facettenCat = createAVVCatalog(makeFacettenCatalogData());
        const svc = makeMockCatalogService(facettenCat);
        const validator = isHierarchyCode(svc as any);
        const result = validator(
            '100|200|10-20',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '100|200|10-20', sampling_date: '' }
        );
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// multipleFacettenAllowed (curried)
// ---------------------------------------------------------------------------

describe('multipleFacettenAllowed', () => {
    it('returns null when field is empty', () => {
        const facettenCat = createAVVCatalog(makeFacettenCatalogData());
        const svc = makeMockCatalogService(facettenCat);
        const validator = multipleFacettenAllowed(svc as any);
        const result = validator(
            '',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '' }
        );
        expect(result).toBeNull();
    });

    it('returns null for a basic code without facetten', () => {
        const facettenCat = createAVVCatalog(makeFacettenCatalogData());
        const svc = makeMockCatalogService(facettenCat);
        const validator = multipleFacettenAllowed(svc as any);
        const result = validator(
            '100|200|',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '100|200|', sampling_date: '' }
        );
        expect(result).toBeNull();
    });

    it('returns error when MehrfachAuswahl=false and multiple values for same facette', () => {
        const facettenCat = createAVVCatalog(makeFacettenCatalogData());
        const svc = makeMockCatalogService(facettenCat);
        const validator = multipleFacettenAllowed(svc as any);
        // facette 10 has MehrfachAuswahl=false; providing two values (20 and 21) is invalid
        const result = validator(
            '100|200|10-20,10-21',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '100|200|10-20,10-21', sampling_date: '' }
        );
        expect(result).toEqual(TEST_ERROR);
    });
});

// ---------------------------------------------------------------------------
// hasObligatoryFacettenValues (curried)
// ---------------------------------------------------------------------------

describe('hasObligatoryFacettenValues', () => {
    it('returns null when field is empty', () => {
        const facettenCat = createAVVCatalog(makeFacettenCatalogData());
        const svc = makeMockCatalogService(facettenCat);
        const validator = hasObligatoryFacettenValues(svc as any);
        const result = validator(
            '',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '' }
        );
        expect(result).toBeNull();
    });

    it('returns null for a Basiseintrag with no obligatory Facettenzuordnungen', () => {
        const facettenCat = createAVVCatalog(makeFacettenCatalogData());
        const svc = makeMockCatalogService(facettenCat);
        const validator = hasObligatoryFacettenValues(svc as any);
        // '100|200|' is Basiseintrag=true and Facettenzuordnungen=[]
        const result = validator(
            '100|200|',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '100|200|', sampling_date: '' }
        );
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// matchesProgramZoMo (curried)
// ---------------------------------------------------------------------------

describe('matchesProgramZoMo', () => {
    const NON_ZOMO_ATTRS = {
        control_program_avv: 'other',
        program_reason_text: 'nothing',
        sampling_date: '01.01.2023',
        program_avv: 'some-program'
    };

    it('returns null when sample is not ZoMo', () => {
        const svc = { getZomoPlan: jest.fn().mockReturnValue(null) };
        const validator = matchesProgramZoMo(svc as any);
        const result = validator(
            'some-program',
            { ...BASE_OPTIONS, date: 'sampling_date', zomoKey: '328' } as any,
            'program_avv',
            NON_ZOMO_ATTRS as any
        );
        expect(result).toBeNull();
    });

    it('returns null when the program value is empty', () => {
        const svc = { getZomoPlan: jest.fn().mockReturnValue(null) };
        const validator = matchesProgramZoMo(svc as any);
        const attrs = {
            control_program_avv: ZOMO_ID.code,
            program_reason_text: '',
            sampling_date: '01.01.2023',
            program_avv: ''
        };
        const result = validator(
            '',
            { ...BASE_OPTIONS, date: 'sampling_date', zomoKey: '328' } as any,
            'program_avv',
            attrs as any
        );
        expect(result).toBeNull();
    });

    it('returns null when ZomoPlan is null', () => {
        const svc = { getZomoPlan: jest.fn().mockReturnValue(null) };
        const validator = matchesProgramZoMo(svc as any);
        const attrs = {
            control_program_avv: ZOMO_ID.code,
            program_reason_text: '',
            sampling_date: '01.01.2023',
            program_avv: 'some-program'
        };
        const result = validator(
            'some-program',
            { ...BASE_OPTIONS, date: 'sampling_date', zomoKey: '328' } as any,
            'program_avv',
            attrs as any
        );
        expect(result).toBeNull();
    });

    it('returns null when no sampling date is present', () => {
        const svc = { getZomoPlan: jest.fn().mockReturnValue([]) };
        const validator = matchesProgramZoMo(svc as any);
        const attrs = {
            control_program_avv: ZOMO_ID.code,
            program_reason_text: '',
            sampling_date: '',
            program_avv: 'some-program'
        };
        const result = validator(
            'some-program',
            { ...BASE_OPTIONS, date: 'sampling_date', zomoKey: '328' } as any,
            'program_avv',
            attrs as any
        );
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// matchesZoMo (curried)
// ---------------------------------------------------------------------------

describe('matchesZoMo', () => {
    it('returns null when no sampling date is present', () => {
        const svc = { getZomoPlan: jest.fn().mockReturnValue([]) };
        const validator = matchesZoMo(svc as any);
        const result = validator(
            'some-value',
            {
                ...BASE_OPTIONS,
                date: 'sampling_date',
                zomoKey: '339',
                codeType: 'facetten',
                programField: { attr: 'program_avv', zomoKey: '328' }
            } as any,
            'animal_avv',
            {
                animal_avv: 'some-value',
                sampling_date: '',
                program_avv: ''
            } as any
        );
        expect(result).toBeNull();
    });

    it('returns null when ZomoPlan is null', () => {
        const svc = { getZomoPlan: jest.fn().mockReturnValue(null) };
        const validator = matchesZoMo(svc as any);
        const result = validator(
            'some-value',
            {
                ...BASE_OPTIONS,
                date: 'sampling_date',
                zomoKey: '339',
                codeType: 'facetten',
                programField: { attr: 'program_avv', zomoKey: '328' }
            } as any,
            'animal_avv',
            {
                animal_avv: 'some-value',
                sampling_date: '01.01.2023',
                program_avv: ''
            } as any
        );
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// matchesZoMo — full ZomoPlan paths (BASIC + PATHOGEN code types)
// ---------------------------------------------------------------------------

describe('matchesZoMo (with ZomoPlan data)', () => {
    // 303 = operations_mode, 319 = matrix, 337 = additional_marks (basic),
    // 339 = animal, 324 = pathogen, 328 = program.
    const MOCK_ZOMO_PLAN: ZomoData[] = [
        {
            '303': [{}],
            '337': [{ 'my-marks': {} }],
            '319': [{}],
            '324': ['Salmonella.*'],
            '328': [{ 'my-program': {} }],
            '339': [{}]
        }
    ];

    it('returns error when program is not found in the ZomoPlan', () => {
        const svc = { getZomoPlan: jest.fn().mockReturnValue(MOCK_ZOMO_PLAN) };
        const validator = matchesZoMo(svc as any);
        const result = validator(
            'my-marks',
            {
                ...BASE_OPTIONS,
                date: 'sampling_date',
                zomoKey: '337',
                codeType: CodeType.BASIC,
                programField: { attr: 'program_avv', zomoKey: '328' }
            } as any,
            'additional_marks_avv',
            {
                additional_marks_avv: 'my-marks',
                sampling_date: '01.01.2023',
                program_avv: 'unknown-program'
            } as any
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns null when program found and BASIC code matches ZomoPlan entry', () => {
        const svc = { getZomoPlan: jest.fn().mockReturnValue(MOCK_ZOMO_PLAN) };
        const validator = matchesZoMo(svc as any);
        const result = validator(
            'my-marks',
            {
                ...BASE_OPTIONS,
                date: 'sampling_date',
                zomoKey: '337',
                codeType: CodeType.BASIC,
                programField: { attr: 'program_avv', zomoKey: '328' }
            } as any,
            'additional_marks_avv',
            {
                additional_marks_avv: 'my-marks',
                sampling_date: '01.01.2023',
                program_avv: 'my-program'
            } as any
        );
        expect(result).toBeNull();
    });

    it('returns error when program found but BASIC code does not match', () => {
        const svc = { getZomoPlan: jest.fn().mockReturnValue(MOCK_ZOMO_PLAN) };
        const validator = matchesZoMo(svc as any);
        const result = validator(
            'unknown-marks',
            {
                ...BASE_OPTIONS,
                date: 'sampling_date',
                zomoKey: '337',
                codeType: CodeType.BASIC,
                programField: { attr: 'program_avv', zomoKey: '328' }
            } as any,
            'additional_marks_avv',
            {
                additional_marks_avv: 'unknown-marks',
                sampling_date: '01.01.2023',
                program_avv: 'my-program'
            } as any
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns null when PATHOGEN pattern matches the value', () => {
        const svc = { getZomoPlan: jest.fn().mockReturnValue(MOCK_ZOMO_PLAN) };
        const validator = matchesZoMo(svc as any);
        const result = validator(
            'Salmonella spp.',
            {
                ...BASE_OPTIONS,
                date: 'sampling_date',
                zomoKey: '324',
                codeType: CodeType.PATHOGEN,
                programField: { attr: 'program_avv', zomoKey: '328' }
            } as any,
            'pathogen_avv',
            {
                pathogen_avv: 'Salmonella spp.',
                sampling_date: '01.01.2023',
                program_avv: 'my-program'
            } as any
        );
        expect(result).toBeNull();
    });

    it('returns error when PATHOGEN pattern does not match the value', () => {
        const svc = { getZomoPlan: jest.fn().mockReturnValue(MOCK_ZOMO_PLAN) };
        const validator = matchesZoMo(svc as any);
        const result = validator(
            'Unknown pathogen',
            {
                ...BASE_OPTIONS,
                date: 'sampling_date',
                zomoKey: '324',
                codeType: CodeType.PATHOGEN,
                programField: { attr: 'program_avv', zomoKey: '328' }
            } as any,
            'pathogen_avv',
            {
                pathogen_avv: 'Unknown pathogen',
                sampling_date: '01.01.2023',
                program_avv: 'my-program'
            } as any
        );
        expect(result).toEqual(TEST_ERROR);
    });
});

// ---------------------------------------------------------------------------
// matchesProgramZoMo — full ZomoPlan paths
// ---------------------------------------------------------------------------

describe('matchesProgramZoMo (with ZomoPlan data)', () => {
    // The program is catalog 328.
    const MOCK_ZOMO_PLAN: ZomoData[] = [
        {
            '303': [{}],
            '337': [{}],
            '319': [{}],
            '324': [],
            '328': [{ 'my-program': {} }],
            '339': [{}]
        }
    ];
    const ZOMO_ATTRS = {
        control_program_avv: ZOMO_ID.code,
        program_reason_text: '',
        sampling_date: '01.01.2023',
        program_avv: 'my-program'
    };

    it('returns null when program is found in ZomoPlan', () => {
        const svc = { getZomoPlan: jest.fn().mockReturnValue(MOCK_ZOMO_PLAN) };
        const validator = matchesProgramZoMo(svc as any);
        const result = validator(
            'my-program',
            { ...BASE_OPTIONS, date: 'sampling_date', zomoKey: '328' } as any,
            'program_avv',
            ZOMO_ATTRS as any
        );
        expect(result).toBeNull();
    });

    it('returns error when program is NOT found in ZomoPlan', () => {
        const svc = { getZomoPlan: jest.fn().mockReturnValue(MOCK_ZOMO_PLAN) };
        const validator = matchesProgramZoMo(svc as any);
        const result = validator(
            'unknown-program',
            { ...BASE_OPTIONS, date: 'sampling_date', zomoKey: '328' } as any,
            'program_avv',
            { ...ZOMO_ATTRS, program_avv: 'unknown-program' } as any
        );
        expect(result).toEqual(TEST_ERROR);
    });
});

// ---------------------------------------------------------------------------
// referenceDate — latest option and additional paths
// ---------------------------------------------------------------------------

describe('referenceDate (latest option)', () => {
    it('returns null when value is on or before the latest reference', () => {
        const result = referenceDate(
            '01-03-2024',
            { ...BASE_OPTIONS, latest: 'sampling_date' },
            'isolation_date',
            { sampling_date: '15-03-2024' }
        );
        expect(result).toBeNull();
    });

    it('returns error when value is after the latest reference', () => {
        const result = referenceDate(
            '20-03-2024',
            { ...BASE_OPTIONS, latest: 'sampling_date' },
            'isolation_date',
            { sampling_date: '15-03-2024' }
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('applies modifier when provided with latest option', () => {
        // reference = 01-03-2024 + 1 year = 01-03-2025; value 15-06-2024 < 01-03-2025 → null
        const result = referenceDate(
            '15-06-2024',
            {
                ...BASE_OPTIONS,
                latest: 'sampling_date',
                modifier: { value: 1, unit: 'year' }
            },
            'isolation_date',
            { sampling_date: '01-03-2024' }
        );
        expect(result).toBeNull();
    });

    it('uses a static date string as reference when key is not in attributes and not NOW', () => {
        // earliest = '01-03-2024' literal; value '15-03-2024' >= '01-03-2024' → null
        const result = referenceDate(
            '15-03-2024',
            { ...BASE_OPTIONS, earliest: '01-03-2024' },
            'some_date',
            {}
        );
        expect(result).toBeNull();
    });

    it('throws when neither earliest nor latest is provided', () => {
        expect(() =>
            referenceDate('01-03-2024', BASE_OPTIONS, 'some_field' as any, {})
        ).toThrow();
    });
});

// ---------------------------------------------------------------------------
// isHierarchyCode — Basiseintrag=false
// ---------------------------------------------------------------------------

describe('isHierarchyCode (non-base entry)', () => {
    function makeCatalogWithNonBaseEntry(): MibiCatalogFacettenData {
        return {
            version: '1',
            gueltigAb: '2023-01-01',
            katalogNummer: '316',
            katalogName: 'Facetten',
            facettenErlaubt: true,
            eintraege: {
                '100|200|': {
                    Text: 'Basiseintrag',
                    Basiseintrag: true,
                    FacettenIds: [],
                    Facettenzuordnungen: []
                },
                '200|300|': {
                    Text: 'Untereintrag',
                    Basiseintrag: false,
                    FacettenIds: [],
                    Facettenzuordnungen: []
                }
            },
            facetten: {}
        };
    }

    it('returns error for Basiseintrag=false entry without facetten values', () => {
        const cat = createAVVCatalog(makeCatalogWithNonBaseEntry());
        const svc = makeMockCatalogService(cat);
        const validator = isHierarchyCode(svc as any);
        const result = validator(
            '200|300|',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '200|300|', sampling_date: '' }
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns null for Basiseintrag=false entry when facetten values ARE present', () => {
        const cat = createAVVCatalog(makeCatalogWithNonBaseEntry());
        const svc = makeMockCatalogService(cat);
        const validator = isHierarchyCode(svc as any);
        const result = validator(
            '200|300|10-20',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '200|300|10-20', sampling_date: '' }
        );
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// multipleFacettenAllowed — additional paths
// ---------------------------------------------------------------------------

describe('multipleFacettenAllowed (additional paths)', () => {
    function makeCatalogWithNonBaseEntry(): MibiCatalogFacettenData {
        return {
            version: '1',
            gueltigAb: '2023-01-01',
            katalogNummer: '316',
            katalogName: 'Facetten',
            facettenErlaubt: true,
            eintraege: {
                '100|200|': {
                    Text: 'Basiseintrag',
                    Basiseintrag: true,
                    FacettenIds: [1],
                    Facettenzuordnungen: []
                },
                '200|300|': {
                    Text: 'Untereintrag',
                    Basiseintrag: false,
                    FacettenIds: [],
                    Facettenzuordnungen: []
                }
            },
            facetten: {
                '10': {
                    FacettenId: 1,
                    MehrfachAuswahl: false,
                    Text: 'Tierart',
                    FacettenWerte: {
                        '20': { Text: 'Rind' },
                        '21': { Text: 'Schwein' }
                    }
                }
            }
        };
    }

    it('returns null when AVV code is not present in the catalog', () => {
        const facettenCat = createAVVCatalog(makeFacettenCatalogData());
        const svc = makeMockCatalogService(facettenCat);
        const validator = multipleFacettenAllowed(svc as any);
        const result = validator(
            '999|888|10-20',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '999|888|10-20', sampling_date: '' }
        );
        expect(result).toBeNull();
    });

    it('returns null when entry is Basiseintrag=false (hierarchy code, facetten check skipped)', () => {
        const cat = createAVVCatalog(makeCatalogWithNonBaseEntry());
        const svc = makeMockCatalogService(cat);
        const validator = multipleFacettenAllowed(svc as any);
        const result = validator(
            '200|300|10-20',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '200|300|10-20', sampling_date: '' }
        );
        expect(result).toBeNull();
    });

    it('returns null when MehrfachAuswahl=false but only one facetten value is provided', () => {
        const facettenCat = createAVVCatalog(makeFacettenCatalogData());
        const svc = makeMockCatalogService(facettenCat);
        const validator = multipleFacettenAllowed(svc as any);
        const result = validator(
            '100|200|10-20',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '100|200|10-20', sampling_date: '' }
        );
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// inAVVFacettenCatalog — hasFacettenInfo=false path
// ---------------------------------------------------------------------------

describe('inAVVFacettenCatalog (hasFacettenInfo=false)', () => {
    it('returns error when code is not a basic code and fails the facetten format', () => {
        const facettenCat = createAVVCatalog(makeFacettenCatalogData());
        const svc = makeMockCatalogService(facettenCat);
        const validator = inAVVFacettenCatalog(svc as any);
        // 'abc|def|' is not a basic code (non-numeric) and fails facettenCodeRegex
        const result = validator(
            'abc|def|',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: 'abc|def|', sampling_date: '' }
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns error for a basic AVV code not found in the facetten catalog', () => {
        const facettenCat = createAVVCatalog(makeFacettenCatalogData());
        const svc = makeMockCatalogService(facettenCat);
        const validator = inAVVFacettenCatalog(svc as any);
        const result = validator(
            '999|888|',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '999|888|', sampling_date: '' }
        );
        expect(result).toEqual(TEST_ERROR);
    });
});

// ---------------------------------------------------------------------------
// matchesIdToSpecificYear — static regex (no year placeholder)
// ---------------------------------------------------------------------------

describe('matchesIdToSpecificYear (static regex)', () => {
    it('uses regex entry as-is when it contains no year placeholder', () => {
        const result = matchesIdToSpecificYear(
            'FIXED-VALUE',
            { ...BASE_OPTIONS, regex: ['^FIXED-VALUE$'] },
            'sample_id_avv',
            {}
        );
        expect(result).toBeNull();
    });

    it('returns error when value does not match a static regex', () => {
        const result = matchesIdToSpecificYear(
            'WRONG-VALUE',
            { ...BASE_OPTIONS, regex: ['^FIXED-VALUE$'] },
            'sample_id_avv',
            {}
        );
        expect(result).toEqual(TEST_ERROR);
    });
});

// ---------------------------------------------------------------------------
// matchesZoMo — FACETTEN code type (checkFacettenCodeForZomo)
// ---------------------------------------------------------------------------

describe('matchesZoMo (FACETTEN code type)', () => {
    // matrix_avv = catalog 319 (facetten), program = catalog 328.
    function makeZomoPlanWithFacetten(facettenEntry: object): ZomoData[] {
        return [
            {
                '303': [{}],
                '337': [{}],
                '319': [facettenEntry],
                '324': [],
                '328': [{ 'my-program': {} }],
                '339': [{}]
            }
        ];
    }

    const FACETTEN_OPTS = {
        ...BASE_OPTIONS,
        date: 'sampling_date',
        zomoKey: '319',
        codeType: CodeType.FACETTEN,
        programField: { attr: 'program_avv', zomoKey: '328' }
    } as any;

    function makeAttrs(matrixValue: string) {
        return {
            matrix_avv: matrixValue,
            sampling_date: '01.01.2023',
            program_avv: 'my-program'
        } as any;
    }

    it('returns null when ZomoPlan FACETTEN entry is effectively empty', () => {
        const zomoPlan = makeZomoPlanWithFacetten({});
        const svc = { getZomoPlan: jest.fn().mockReturnValue(zomoPlan) };
        const validator = matchesZoMo(svc as any);
        const result = validator(
            '100|200|',
            FACETTEN_OPTS,
            'matrix_avv',
            makeAttrs('100|200|')
        );
        expect(result).toBeNull();
    });

    it('returns null when FACETTEN entry has empty-string key and value is empty (zomoPlanHasEmptyProperty)', () => {
        const zomoPlan = makeZomoPlanWithFacetten({ '': {} });
        const svc = { getZomoPlan: jest.fn().mockReturnValue(zomoPlan) };
        const validator = matchesZoMo(svc as any);
        const result = validator(
            '',
            FACETTEN_OPTS,
            'matrix_avv',
            makeAttrs('')
        );
        expect(result).toBeNull();
    });

    it('returns null when basic code is found in ZomoPlan FACETTEN entry with empty facetten object', () => {
        const zomoPlan = makeZomoPlanWithFacetten({ '100|200|': {} });
        const svc = { getZomoPlan: jest.fn().mockReturnValue(zomoPlan) };
        const validator = matchesZoMo(svc as any);
        const result = validator(
            '100|200|',
            FACETTEN_OPTS,
            'matrix_avv',
            makeAttrs('100|200|')
        );
        expect(result).toBeNull();
    });

    it('returns error when basic code is NOT in ZomoPlan FACETTEN entry', () => {
        const zomoPlan = makeZomoPlanWithFacetten({ '999|888|': {} });
        const svc = { getZomoPlan: jest.fn().mockReturnValue(zomoPlan) };
        const validator = matchesZoMo(svc as any);
        const result = validator(
            '100|200|',
            FACETTEN_OPTS,
            'matrix_avv',
            makeAttrs('100|200|')
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns null when code with facetten satisfies AND constraint in ZomoPlan', () => {
        // ZomoPlan: '100|200|' → { '10': { and: [20] } }
        // value '100|200|10-20': facettenField = [['10', ['20']]]
        // andValues = [20], numericDetails = [20] → all match → true
        const zomoPlan = makeZomoPlanWithFacetten({
            '100|200|': { '10': { and: [20] } }
        });
        const svc = { getZomoPlan: jest.fn().mockReturnValue(zomoPlan) };
        const validator = matchesZoMo(svc as any);
        const result = validator(
            '100|200|10-20',
            FACETTEN_OPTS,
            'matrix_avv',
            makeAttrs('100|200|10-20')
        );
        expect(result).toBeNull();
    });

    it('returns error when code with facetten does NOT satisfy AND constraint', () => {
        // ZomoPlan requires facette 10 AND value 20, but we supply value 21
        const zomoPlan = makeZomoPlanWithFacetten({
            '100|200|': { '10': { and: [20] } }
        });
        const svc = { getZomoPlan: jest.fn().mockReturnValue(zomoPlan) };
        const validator = matchesZoMo(svc as any);
        const result = validator(
            '100|200|10-21',
            FACETTEN_OPTS,
            'matrix_avv',
            makeAttrs('100|200|10-21')
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns null when code with facetten satisfies OR constraint in ZomoPlan', () => {
        // ZomoPlan: '100|200|' → { '10': { or: [20, 21] } }
        // value '100|200|10-20': 20 is in [20, 21] → true
        const zomoPlan = makeZomoPlanWithFacetten({
            '100|200|': { '10': { or: [20, 21] } }
        });
        const svc = { getZomoPlan: jest.fn().mockReturnValue(zomoPlan) };
        const validator = matchesZoMo(svc as any);
        const result = validator(
            '100|200|10-20',
            FACETTEN_OPTS,
            'matrix_avv',
            makeAttrs('100|200|10-20')
        );
        expect(result).toBeNull();
    });

    it('returns error when code with facetten does NOT satisfy OR constraint', () => {
        // ZomoPlan requires facette 10 with OR [20, 21], but we supply 99
        const zomoPlan = makeZomoPlanWithFacetten({
            '100|200|': { '10': { or: [20, 21] } }
        });
        const svc = { getZomoPlan: jest.fn().mockReturnValue(zomoPlan) };
        const validator = matchesZoMo(svc as any);
        const result = validator(
            '100|200|10-99',
            FACETTEN_OPTS,
            'matrix_avv',
            makeAttrs('100|200|10-99')
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns error when entire ZomoPlan is a single empty entry', () => {
        // getProgramIndexForZomo([{}], ...) → isZomoPlanEntryEmpty([{}]) → returns -1
        const svc = { getZomoPlan: jest.fn().mockReturnValue([{}]) };
        const validator = matchesZoMo(svc as any);
        const result = validator(
            '100|200|',
            FACETTEN_OPTS,
            'matrix_avv',
            makeAttrs('100|200|')
        );
        expect(result).toEqual(TEST_ERROR);
    });
});

// ---------------------------------------------------------------------------
// hasObligatoryFacettenValues — entry with obligatory facetten
// ---------------------------------------------------------------------------

describe('hasObligatoryFacettenValues (obligatory facetten present)', () => {
    function makeCatalogWithObligatoryFacetten(): MibiCatalogFacettenData {
        return {
            version: '1',
            gueltigAb: '2023-01-01',
            katalogNummer: '316',
            katalogName: 'Facetten',
            facettenErlaubt: true,
            eintraege: {
                '100|200|': {
                    Text: 'Pflichtfacette',
                    Basiseintrag: true,
                    FacettenIds: [1],
                    Facettenzuordnungen: [
                        { FacettenId: 1, FacettenwertId: 10, Festgelegt: true }
                    ]
                }
            },
            facetten: {
                '10': {
                    FacettenId: 1,
                    MehrfachAuswahl: false,
                    Text: 'Tierart',
                    FacettenWerte: { '20': { Text: 'Rind' } }
                }
            },
            facettenIds: {
                '1': {
                    '10': { FacettenNameBegriffsId: 10, WertNameBegriffsId: 20 }
                }
            }
        };
    }

    it('returns error when entry requires obligatory facetten but none are provided', () => {
        const cat = createAVVCatalog(makeCatalogWithObligatoryFacetten());
        const svc = makeMockCatalogService(cat);
        const validator = hasObligatoryFacettenValues(svc as any);
        const result = validator(
            '100|200|',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '100|200|', sampling_date: '' }
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('returns null when all obligatory facetten values are correctly provided', () => {
        const cat = createAVVCatalog(makeCatalogWithObligatoryFacetten());
        const svc = makeMockCatalogService(cat);
        const validator = hasObligatoryFacettenValues(svc as any);
        // createFacettenMap('10-20') → Map { 10 => [20] }
        // facettenIds[1][10].WertNameBegriffsId = 20, included in [20] → valid
        const result = validator(
            '100|200|10-20',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '100|200|10-20', sampling_date: '' }
        );
        expect(result).toBeNull();
    });

    it('returns error when obligatory facetten value does not match required WertNameBegriffsId', () => {
        const cat = createAVVCatalog(makeCatalogWithObligatoryFacetten());
        const svc = makeMockCatalogService(cat);
        const validator = hasObligatoryFacettenValues(svc as any);
        // createFacettenMap('10-99') → Map { 10 => [99] }
        // WertNameBegriffsId = 20, not in [99] → invalid
        const result = validator(
            '100|200|10-99',
            { ...BASE_OPTIONS, catalog: 'avv316', key: 'matrix_avv' },
            'matrix_avv',
            { matrix_avv: '100|200|10-99', sampling_date: '' }
        );
        expect(result).toEqual(TEST_ERROR);
    });
});

// ---------------------------------------------------------------------------
// matchesZoMo — forbidden ("not") codes
// ---------------------------------------------------------------------------

describe('matchesZoMo (forbidden "not" codes)', () => {
    // 337 = additional_marks (basic), 303 = operations_mode (facetten),
    // 319 = matrix (facetten), 328 = program.
    function makePlan(field: keyof ZomoData, entries: object[]): ZomoData[] {
        const base: ZomoData = {
            '303': [{}],
            '337': [{}],
            '319': [{}],
            '324': [],
            '328': [{ 'my-program': {} }],
            '339': [{}]
        };
        return [{ ...base, [field]: entries }];
    }

    function makeValidator(plan: ZomoData[]) {
        const svc = { getZomoPlan: jest.fn().mockReturnValue(plan) };
        return matchesZoMo(svc as any);
    }

    function basicOpts(zomoKey: keyof ZomoData) {
        return {
            ...BASE_OPTIONS,
            date: 'sampling_date',
            zomoKey,
            codeType: CodeType.BASIC,
            programField: { attr: 'program_avv', zomoKey: '328' }
        } as any;
    }

    function facettenOpts(zomoKey: keyof ZomoData) {
        return {
            ...BASE_OPTIONS,
            date: 'sampling_date',
            zomoKey,
            codeType: CodeType.FACETTEN,
            programField: { attr: 'program_avv', zomoKey: '328' }
        } as any;
    }

    function attrs(field: string, value: string) {
        return {
            [field]: value,
            sampling_date: '01.01.2023',
            program_avv: 'my-program'
        } as any;
    }

    // --- BASIC (337), forbidden only: every other code allowed -------------

    it('rejects a forbidden BASIC code (337) when it is the only entry', () => {
        const plan = makePlan('337', [{ not: { '21525|12304|': {} } }]);
        const result = makeValidator(plan)(
            '21525|12304|',
            basicOpts('337'),
            'additional_marks_avv',
            attrs('additional_marks_avv', '21525|12304|')
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('allows any other BASIC code (337) when the field has only a forbidden code', () => {
        const plan = makePlan('337', [{ not: { '21525|12304|': {} } }]);
        const result = makeValidator(plan)(
            '99999|88888|',
            basicOpts('337'),
            'additional_marks_avv',
            attrs('additional_marks_avv', '99999|88888|')
        );
        expect(result).toBeNull();
    });

    it('allows an empty value when the field has only a forbidden code', () => {
        const plan = makePlan('337', [{ not: { '21525|12304|': {} } }]);
        const result = makeValidator(plan)(
            '',
            basicOpts('337'),
            'additional_marks_avv',
            attrs('additional_marks_avv', '')
        );
        expect(result).toBeNull();
    });

    // --- BASIC (337), obligatory + forbidden -------------------------------

    it('allows the obligatory BASIC code when an obligatory and a forbidden code coexist', () => {
        const plan = makePlan('337', [
            { '11111|22222|': {} },
            { not: { '21525|12304|': {} } }
        ]);
        const result = makeValidator(plan)(
            '11111|22222|',
            basicOpts('337'),
            'additional_marks_avv',
            attrs('additional_marks_avv', '11111|22222|')
        );
        expect(result).toBeNull();
    });

    it('rejects the forbidden BASIC code even when an obligatory code exists', () => {
        const plan = makePlan('337', [
            { '11111|22222|': {} },
            { not: { '21525|12304|': {} } }
        ]);
        const result = makeValidator(plan)(
            '21525|12304|',
            basicOpts('337'),
            'additional_marks_avv',
            attrs('additional_marks_avv', '21525|12304|')
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('rejects a BASIC code that is neither the obligatory nor a forbidden code', () => {
        const plan = makePlan('337', [
            { '11111|22222|': {} },
            { not: { '21525|12304|': {} } }
        ]);
        const result = makeValidator(plan)(
            '99999|88888|',
            basicOpts('337'),
            'additional_marks_avv',
            attrs('additional_marks_avv', '99999|88888|')
        );
        expect(result).toEqual(TEST_ERROR);
    });

    // --- FACETTEN (303), broad obligatory + specific forbidden ------------
    // Mirrors the ticket: "62724|57624|" is obligatory (broad), but the
    // specific detailed code is forbidden.

    const FORBIDDEN_FACETTEN = {
        '62724|57624|': {
            '2': { and: [68041] },
            '63420': { and: [2295, 2803] },
            '63422': { and: [10492, 63515, 63559] },
            '63423': { and: [10565] }
        }
    };

    function makeMixedFacettenPlan() {
        return makePlan('303', [
            { '62724|57624|': {} },
            { not: FORBIDDEN_FACETTEN }
        ]);
    }

    it('allows the broad obligatory facetten (basic) code', () => {
        const result = makeValidator(makeMixedFacettenPlan())(
            '62724|57624|',
            facettenOpts('303'),
            'operations_mode_avv',
            attrs('operations_mode_avv', '62724|57624|')
        );
        expect(result).toBeNull();
    });

    it('rejects the exact forbidden facetten code', () => {
        const result = makeValidator(makeMixedFacettenPlan())(
            '62724|57624|2-68041,63420-2295:2803,63422-10492:63515:63559,63423-10565',
            facettenOpts('303'),
            'operations_mode_avv',
            attrs(
                'operations_mode_avv',
                '62724|57624|2-68041,63420-2295:2803,63422-10492:63515:63559,63423-10565'
            )
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('rejects the forbidden facetten code even when facetten are in a different order (semantic match)', () => {
        const reordered =
            '62724|57624|63420-2803:2295,2-68041,63423-10565,63422-63559:10492:63515';
        const result = makeValidator(makeMixedFacettenPlan())(
            reordered,
            facettenOpts('303'),
            'operations_mode_avv',
            attrs('operations_mode_avv', reordered)
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('allows a more specific code that does not match the full forbidden combination', () => {
        // Only one of the forbidden facetten ids is present, so it is not the
        // forbidden code; it still matches the broad obligatory code.
        const result = makeValidator(makeMixedFacettenPlan())(
            '62724|57624|2-68041',
            facettenOpts('303'),
            'operations_mode_avv',
            attrs('operations_mode_avv', '62724|57624|2-68041')
        );
        expect(result).toBeNull();
    });

    // --- FACETTEN (319), forbidden only -----------------------------------

    it('rejects a forbidden facetten code (319) when it is the only entry', () => {
        const plan = makePlan('319', [
            { not: { '100|200|': { '10': { and: [20] } } } }
        ]);
        const result = makeValidator(plan)(
            '100|200|10-20',
            facettenOpts('319'),
            'matrix_avv',
            attrs('matrix_avv', '100|200|10-20')
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('allows any other facetten code (319) when the field has only a forbidden code', () => {
        const plan = makePlan('319', [
            { not: { '100|200|': { '10': { and: [20] } } } }
        ]);
        const result = makeValidator(plan)(
            '999|888|',
            facettenOpts('319'),
            'matrix_avv',
            attrs('matrix_avv', '999|888|')
        );
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// matchesZoMo — empty field allowed via "" entry (trailing ";" in the plan)
// ---------------------------------------------------------------------------
//
// A trailing ";" in a ZoMo plan field means the field may also be left empty.
// The parser represents this as an additional `{ "": {} }` entry, e.g.
//   "337": [ { "21525|12304|": {} }, { "": {} } ]
// An empty sample value must then be accepted, while a non-empty value must
// still match one of the listed codes.

describe('matchesZoMo (empty field allowed via "" entry)', () => {
    // 337 = additional_marks (basic), 319 = matrix (facetten), 328 = program.
    function makePlan(field: keyof ZomoData, entries: object[]): ZomoData[] {
        const base: ZomoData = {
            '303': [{}],
            '337': [{}],
            '319': [{}],
            '324': [],
            '328': [{ 'my-program': {} }],
            '339': [{}]
        };
        return [{ ...base, [field]: entries }];
    }

    function makeValidator(plan: ZomoData[]) {
        const svc = { getZomoPlan: jest.fn().mockReturnValue(plan) };
        return matchesZoMo(svc as any);
    }

    function basicOpts(zomoKey: keyof ZomoData) {
        return {
            ...BASE_OPTIONS,
            date: 'sampling_date',
            zomoKey,
            codeType: CodeType.BASIC,
            programField: { attr: 'program_avv', zomoKey: '328' }
        } as any;
    }

    function facettenOpts(zomoKey: keyof ZomoData) {
        return {
            ...BASE_OPTIONS,
            date: 'sampling_date',
            zomoKey,
            codeType: CodeType.FACETTEN,
            programField: { attr: 'program_avv', zomoKey: '328' }
        } as any;
    }

    function attrs(field: string, value: string) {
        return {
            [field]: value,
            sampling_date: '01.01.2023',
            program_avv: 'my-program'
        } as any;
    }

    // --- BASIC (337) with obligatory code + "" entry ----------------------

    it('allows an empty value when a BASIC field permits empty via the "" entry', () => {
        const plan = makePlan('337', [{ '21525|12304|': {} }, { '': {} }]);
        const result = makeValidator(plan)(
            '',
            basicOpts('337'),
            'additional_marks_avv',
            attrs('additional_marks_avv', '')
        );
        expect(result).toBeNull();
    });

    it('allows the obligatory BASIC code when empty is also permitted', () => {
        const plan = makePlan('337', [{ '21525|12304|': {} }, { '': {} }]);
        const result = makeValidator(plan)(
            '21525|12304|',
            basicOpts('337'),
            'additional_marks_avv',
            attrs('additional_marks_avv', '21525|12304|')
        );
        expect(result).toBeNull();
    });

    it('still rejects an unrelated BASIC code even though empty is permitted', () => {
        const plan = makePlan('337', [{ '21525|12304|': {} }, { '': {} }]);
        const result = makeValidator(plan)(
            '99999|88888|',
            basicOpts('337'),
            'additional_marks_avv',
            attrs('additional_marks_avv', '99999|88888|')
        );
        expect(result).toEqual(TEST_ERROR);
    });

    it('rejects an empty value when a BASIC field has an obligatory code but no "" entry', () => {
        const plan = makePlan('337', [{ '21525|12304|': {} }]);
        const result = makeValidator(plan)(
            '',
            basicOpts('337'),
            'additional_marks_avv',
            attrs('additional_marks_avv', '')
        );
        expect(result).toEqual(TEST_ERROR);
    });

    // --- FACETTEN (319) with obligatory code + "" entry -------------------

    it('allows an empty value when a FACETTEN field permits empty via the "" entry', () => {
        const plan = makePlan('319', [
            { '100|200|': { '10': { and: [20] } } },
            { '': {} }
        ]);
        const result = makeValidator(plan)(
            '',
            facettenOpts('319'),
            'matrix_avv',
            attrs('matrix_avv', '')
        );
        expect(result).toBeNull();
    });

    it('still validates a real facetten code normally when empty is also permitted', () => {
        const plan = makePlan('319', [
            { '100|200|': { '10': { and: [20] } } },
            { '': {} }
        ]);
        const validator = makeValidator(plan);

        const matching = validator(
            '100|200|10-20',
            facettenOpts('319'),
            'matrix_avv',
            attrs('matrix_avv', '100|200|10-20')
        );
        expect(matching).toBeNull();

        const nonMatching = validator(
            '100|200|10-21',
            facettenOpts('319'),
            'matrix_avv',
            attrs('matrix_avv', '100|200|10-21')
        );
        expect(nonMatching).toEqual(TEST_ERROR);
    });

    it('rejects an empty value when a FACETTEN field has a code but no "" entry', () => {
        const plan = makePlan('319', [{ '100|200|': { '10': { and: [20] } } }]);
        const result = makeValidator(plan)(
            '',
            facettenOpts('319'),
            'matrix_avv',
            attrs('matrix_avv', '')
        );
        expect(result).toEqual(TEST_ERROR);
    });
});
