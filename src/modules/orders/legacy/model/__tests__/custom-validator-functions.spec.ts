import moment from 'moment';
import { NRL_ID_VALUE } from '../../../../shared/domain/valueObjects';
import { AVVCatalog, createAVVCatalog } from '../avvcatalog.entity';
import { AVV324Data, MibiCatalogFacettenData, ZOMO_ID } from '../legacy.model';
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
            { ...BASE_OPTIONS, date: 'sampling_date', zomoKey: '303' } as any,
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
            { ...BASE_OPTIONS, date: 'sampling_date', zomoKey: '303' } as any,
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
            { ...BASE_OPTIONS, date: 'sampling_date', zomoKey: '303' } as any,
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
            { ...BASE_OPTIONS, date: 'sampling_date', zomoKey: '303' } as any,
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
                zomoKey: '303',
                codeType: 'basic',
                programField: { attr: 'program_avv', zomoKey: '303' }
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
                zomoKey: '303',
                codeType: 'basic',
                programField: { attr: 'program_avv', zomoKey: '303' }
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
