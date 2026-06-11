import { createAVVCatalog } from '../../model/avvcatalog.entity';
import {
    AVV324Data,
    CorrectionSuggestions,
    SampleData
} from '../../model/legacy.model';
import {
    autoCorrectAVV324,
    autoCorrectSequenceStatus
} from '../custom-auto-correction-functions';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(value: string = '') {
    return { value, errors: [], correctionOffer: [] };
}

function makeSampleData(
    pathogen: string,
    samplingDate = '01.01.2024'
): SampleData {
    return {
        sample_id: makeEntry(),
        sample_id_avv: makeEntry(),
        partial_sample_id: makeEntry(),
        pathogen_avv: makeEntry(pathogen),
        pathogen_text: makeEntry(),
        sequence_id: makeEntry(),
        sequence_status: makeEntry(),
        sampling_date: makeEntry(samplingDate),
        isolation_date: makeEntry(),
        sampling_location_avv: makeEntry(),
        sampling_location_zip: makeEntry(),
        sampling_location_text: makeEntry(),
        animal_avv: makeEntry(),
        matrix_avv: makeEntry(),
        animal_matrix_text: makeEntry(),
        additional_marks_avv: makeEntry(),
        control_program_avv: makeEntry(),
        sampling_reason_avv: makeEntry(),
        program_reason_text: makeEntry(),
        operations_mode_avv: makeEntry(),
        operations_mode_text: makeEntry(),
        vvvo: makeEntry(),
        program_avv: makeEntry(),
        comment: makeEntry()
    };
}

function makeAvv324Data(
    textEintraege: Record<string, string> = {},
    eintraege: Record<string, any> = {},
    fuzzyEintraege: any[] = []
): AVV324Data {
    return {
        version: '1',
        gueltigAb: '2023-01-01',
        katalogNummer: '324',
        katalogName: 'Pathogene',
        facettenErlaubt: false,
        eintraege: {
            '9876|1234|': { Text: 'Salmonella spp.', Basiseintrag: true },
            ...eintraege
        },
        textEintraege: {
            'Escherichia coli': '111|222|',
            'Salmonella spp.': '9876|1234|',
            'Genus Campylobacter': '333|444|',
            ...textEintraege
        },
        fuzzyEintraege: [
            { Text: 'Escherichia coli', Kode: '111|222|', Basiseintrag: true },
            { Text: 'Salmonella spp.', Kode: '9876|1234|', Basiseintrag: true },
            {
                Text: 'Campylobacter jejuni',
                Kode: '555|666|',
                Basiseintrag: true
            },
            ...fuzzyEintraege
        ]
    };
}

function makeCatalogService(avv324DataOverride?: Partial<AVV324Data>) {
    const data = makeAvv324Data(
        avv324DataOverride?.textEintraege,
        avv324DataOverride?.eintraege,
        avv324DataOverride?.fuzzyEintraege
    );
    const catalog = createAVVCatalog(data);
    return {
        getAVVCatalog: jest.fn().mockReturnValue(catalog),
        getCatalogSearchAliases: jest.fn().mockReturnValue([])
    };
}

// ---------------------------------------------------------------------------
// autoCorrectAVV324
// ---------------------------------------------------------------------------

describe('autoCorrectAVV324', () => {
    it('returns null for an empty pathogen_avv value', () => {
        const svc = makeCatalogService();
        const fn = autoCorrectAVV324(svc as any);
        const result = fn(makeSampleData(''));
        expect(result).toBeNull();
    });

    it('returns null for a value that already exists as a text entry (correct value)', () => {
        const svc = makeCatalogService();
        const fn = autoCorrectAVV324(svc as any);
        const result = fn(makeSampleData('Escherichia coli'));
        expect(result).toBeNull();
    });

    it('returns null for a value with only whitespace', () => {
        const svc = makeCatalogService();
        const fn = autoCorrectAVV324(svc as any);
        const result = fn(makeSampleData('   '));
        expect(result).toBeNull();
    });

    it('returns correction suggestion (code 88) when value is a bare AVV code with known text', () => {
        const svc = makeCatalogService();
        const fn = autoCorrectAVV324(svc as any);
        const result = fn(
            makeSampleData('9876|1234|')
        ) as CorrectionSuggestions;
        expect(result).not.toBeNull();
        expect(result.code).toBe(88);
        expect(result.correctionOffer).toContain('Salmonella spp.');
        expect(result.field).toBe('pathogen_avv');
    });

    it('returns correction for "Genus {value}" when genus form exists in catalog', () => {
        const svc = makeCatalogService();
        const fn = autoCorrectAVV324(svc as any);
        // 'Campylobacter' → 'Genus Campylobacter' is a text entry
        const result = fn(
            makeSampleData('Campylobacter')
        ) as CorrectionSuggestions;
        expect(result).not.toBeNull();
        expect(result.code).toBe(88);
        expect(result.correctionOffer).toContain('Genus Campylobacter');
    });

    it('returns fuzzy search suggestions when no exact match is found', () => {
        const svc = makeCatalogService();
        const fn = autoCorrectAVV324(svc as any);
        // 'Campylobactr' → typo, fuzzy should match 'Campylobacter jejuni'
        const result = fn(
            makeSampleData('Campylobactr')
        ) as CorrectionSuggestions;
        expect(result).not.toBeNull();
        expect(result.correctionOffer.length).toBeGreaterThan(0);
    });

    it('returns correction with alias as first offer when a search alias matches', () => {
        const svcWithAlias = {
            getAVVCatalog: jest
                .fn()
                .mockReturnValue(createAVVCatalog(makeAvv324Data())),
            getCatalogSearchAliases: jest.fn().mockReturnValue([
                {
                    catalog: 'avv324',
                    token: 'Escherichia coli',
                    alias: ['E. coli', 'E.coli']
                }
            ])
        };
        const fn = autoCorrectAVV324(svcWithAlias as any);
        // 'E. coli' is an alias for 'Escherichia coli'
        const result = fn(makeSampleData('E. coli')) as CorrectionSuggestions;
        expect(result).not.toBeNull();
        expect(result.correctionOffer[0]).toBe('Escherichia coli');
    });

    it('sets correction field to "pathogen_avv"', () => {
        const svc = makeCatalogService();
        const fn = autoCorrectAVV324(svc as any);
        const result = fn(
            makeSampleData('9876|1234|')
        ) as CorrectionSuggestions;
        expect(result!.field).toBe('pathogen_avv');
    });

    it('preserves the original value in the correction suggestion', () => {
        const svc = makeCatalogService();
        const fn = autoCorrectAVV324(svc as any);
        const result = fn(
            makeSampleData('9876|1234|')
        ) as CorrectionSuggestions;
        expect(result!.original).toBe('9876|1234|');
    });
});

// ---------------------------------------------------------------------------
// autoCorrectSequenceStatus
// ---------------------------------------------------------------------------

describe('autoCorrectSequenceStatus', () => {
    function makeSequenceSampleData(status: string): SampleData {
        const base = makeSampleData('');
        base.sequence_status = makeEntry(status);
        return base;
    }

    it('returns null when sequence_status field is absent from sampleData', () => {
        const fn = autoCorrectSequenceStatus();
        const data = makeSampleData('');
        // Remove the field to simulate absence
        delete (data as any).sequence_status;
        const result = fn(data);
        expect(result).toBeNull();
    });

    it('returns null for empty sequence_status value', () => {
        const fn = autoCorrectSequenceStatus();
        const result = fn(makeSequenceSampleData(''));
        expect(result).toBeNull();
    });

    it('returns null for already-correct value "QC-PASS"', () => {
        const fn = autoCorrectSequenceStatus();
        expect(fn(makeSequenceSampleData('QC-PASS'))).toBeNull();
    });

    it('returns null for already-correct value "QC-FAIL"', () => {
        const fn = autoCorrectSequenceStatus();
        expect(fn(makeSequenceSampleData('QC-FAIL'))).toBeNull();
    });

    it('returns null for already-correct value "in Bearbeitung"', () => {
        const fn = autoCorrectSequenceStatus();
        expect(fn(makeSequenceSampleData('in Bearbeitung'))).toBeNull();
    });

    it('returns null for already-correct value "in Planung"', () => {
        const fn = autoCorrectSequenceStatus();
        expect(fn(makeSequenceSampleData('in Planung'))).toBeNull();
    });

    it('returns silent correction (code -1) for "qc-pass" (case variant)', () => {
        const fn = autoCorrectSequenceStatus();
        const result = fn(
            makeSequenceSampleData('qc-pass')
        ) as CorrectionSuggestions;
        expect(result).not.toBeNull();
        expect(result.code).toBe(-1);
        expect(result.correctionOffer).toContain('QC-PASS');
    });

    it('returns silent correction (code -1) for "QC PASS" (space variant)', () => {
        const fn = autoCorrectSequenceStatus();
        const result = fn(
            makeSequenceSampleData('QC PASS')
        ) as CorrectionSuggestions;
        expect(result).not.toBeNull();
        expect(result.code).toBe(-1);
        expect(result.correctionOffer).toContain('QC-PASS');
    });

    it('returns silent correction (code -1) for "qc-fail" (lowercase)', () => {
        const fn = autoCorrectSequenceStatus();
        const result = fn(
            makeSequenceSampleData('qc-fail')
        ) as CorrectionSuggestions;
        expect(result).not.toBeNull();
        expect(result.code).toBe(-1);
        expect(result.correctionOffer).toContain('QC-FAIL');
    });

    it('returns silent correction (code -1) for "in bearbeitung" (lowercase)', () => {
        const fn = autoCorrectSequenceStatus();
        const result = fn(
            makeSequenceSampleData('in bearbeitung')
        ) as CorrectionSuggestions;
        expect(result).not.toBeNull();
        expect(result.code).toBe(-1);
        expect(result.correctionOffer).toContain('in Bearbeitung');
    });

    it('returns silent correction (code -1) for "in planung" (lowercase)', () => {
        const fn = autoCorrectSequenceStatus();
        const result = fn(
            makeSequenceSampleData('in planung')
        ) as CorrectionSuggestions;
        expect(result).not.toBeNull();
        expect(result.code).toBe(-1);
        expect(result.correctionOffer).toContain('in Planung');
    });

    it('returns suggestion with code 0 and all 4 valid options for an unrecognised value', () => {
        const fn = autoCorrectSequenceStatus();
        const result = fn(
            makeSequenceSampleData('some random status')
        ) as CorrectionSuggestions;
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
        expect(result.correctionOffer).toEqual([
            'QC-PASS',
            'QC-FAIL',
            'in Bearbeitung',
            'in Planung'
        ]);
    });

    it('sets field to "sequence_status" in the correction suggestion', () => {
        const fn = autoCorrectSequenceStatus();
        const result = fn(
            makeSequenceSampleData('qc pass')
        ) as CorrectionSuggestions;
        expect(result!.field).toBe('sequence_status');
    });
});
