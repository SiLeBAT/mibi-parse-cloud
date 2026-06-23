import { createAVVCatalog } from '../../model/avvcatalog.entity';
import {
    AVV324Data,
    AnnotatedSampleDataEntry,
    SampleData,
    Urgency
} from '../../model/legacy.model';
import { Sample } from '../../model/sample.entity';
import { NRL_ID_VALUE } from '../../../../shared/domain/valueObjects';
import { FormAutoCorrectionService } from '../form-auto-correction.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(value = ''): AnnotatedSampleDataEntry {
    return { value, errors: [], correctionOffer: [] };
}

function makeSampleData(pathogen = '', sequenceStatus = ''): SampleData {
    return {
        sample_id: makeEntry(),
        sample_id_avv: makeEntry(),
        partial_sample_id: makeEntry(),
        pathogen_avv: makeEntry(pathogen),
        pathogen_text: makeEntry(),
        sequence_id: makeEntry(),
        sequence_status: makeEntry(sequenceStatus),
        sampling_date: makeEntry('01.01.2024'),
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

function makeMeta() {
    return {
        nrl: NRL_ID_VALUE.UNKNOWN,
        urgency: Urgency.NORMAL,
        analysis: {}
    };
}

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

function makeCatalogService() {
    const catalog = createAVVCatalog(makeAvv324Data());
    return {
        getAVVCatalog: jest.fn().mockReturnValue(catalog),
        getCatalogSearchAliases: jest.fn().mockReturnValue([])
    };
}

function makeValidationErrorProvider() {
    return {
        getError: jest
            .fn()
            .mockReturnValue({ code: 88, level: 2, message: 'Test' })
    };
}

function makeNrlService() {
    return {
        isPathogenRelevantForBfR: jest.fn().mockReturnValue(false)
    };
}

function makeService() {
    return new FormAutoCorrectionService(
        makeCatalogService() as any,
        makeValidationErrorProvider() as any,
        makeNrlService() as any
    );
}

// ---------------------------------------------------------------------------
// applyAutoCorrection
// ---------------------------------------------------------------------------

describe('FormAutoCorrectionService.applyAutoCorrection', () => {
    it('returns empty array for an empty sample collection', async () => {
        const svc = makeService();
        const result = await svc.applyAutoCorrection([]);
        expect(result).toHaveLength(0);
    });

    it('returns the same number of samples as provided', async () => {
        const svc = makeService();
        const samples = [
            Sample.create(makeSampleData('Escherichia coli'), makeMeta()),
            Sample.create(makeSampleData('Salmonella spp.'), makeMeta())
        ];
        const result = await svc.applyAutoCorrection(samples);
        expect(result).toHaveLength(2);
    });

    it('does not mutate the original samples (clones before correcting)', async () => {
        const svc = makeService();
        const original = Sample.create(
            makeSampleData('9876|1234|'),
            makeMeta()
        );
        const originalValue = original.getValueFor('pathogen_avv');
        await svc.applyAutoCorrection([original]);
        // Original should be unchanged
        expect(original.getValueFor('pathogen_avv')).toBe(originalValue);
    });

    it('returns sample unchanged when all correction functions return null', async () => {
        const svc = makeService();
        // 'Escherichia coli' exists in textEintraege → autoCorrectAVV324 returns null
        // 'QC-PASS' is already correct → autoCorrectSequenceStatus returns null
        const sample = Sample.create(
            makeSampleData('Escherichia coli', 'QC-PASS'),
            makeMeta()
        );
        const results = await svc.applyAutoCorrection([sample]);
        const correctionOffers =
            results[0].getEntryFor('pathogen_avv').correctionOffer;
        expect(correctionOffers).toHaveLength(0);
    });

    it('applies a silent correction (code -1) to the sample without adding an error', async () => {
        const svc = makeService();
        // 'qc-pass' → autoCorrectSequenceStatus returns code -1, corrects to 'QC-PASS'
        const sample = Sample.create(
            makeSampleData('Escherichia coli', 'qc-pass'),
            makeMeta()
        );
        const results = await svc.applyAutoCorrection([sample]);
        const statusEntry = results[0].getEntryFor('sequence_status');
        // Silent correction applied: value changed to 'QC-PASS'
        expect(statusEntry.value).toBe('QC-PASS');
        // No error should have been added (code -1 = silent)
        expect(statusEntry.errors).toHaveLength(0);
    });

    it('adds an error when correction has a non-zero code', async () => {
        const svc = makeService();
        // '9876|1234|' is a bare AVV code → autoCorrectAVV324 returns code 88
        const sample = Sample.create(makeSampleData('9876|1234|'), makeMeta());
        const results = await svc.applyAutoCorrection([sample]);
        const pathogenEntry = results[0].getEntryFor('pathogen_avv');
        expect(pathogenEntry.errors.length).toBeGreaterThan(0);
    });

    it('applies the single correction offer and updates the value (code 88 auto-apply)', async () => {
        const svc = makeService();
        // '9876|1234|' is a bare AVV code → correction to 'Salmonella spp.' (code 88)
        // applySingleCorrectionSuggestions auto-applies a single code-88 offer
        const sample = Sample.create(makeSampleData('9876|1234|'), makeMeta());
        const results = await svc.applyAutoCorrection([sample]);
        const pathogenEntry = results[0].getEntryFor('pathogen_avv');
        expect(pathogenEntry.value).toBe('Salmonella spp.');
    });

    it('processes each sample independently', async () => {
        const svc = makeService();
        const samples = [
            Sample.create(makeSampleData('9876|1234|', 'qc-pass'), makeMeta()),
            Sample.create(
                makeSampleData('Escherichia coli', 'QC-PASS'),
                makeMeta()
            )
        ];
        const results = await svc.applyAutoCorrection(samples);

        // First sample: pathogen needs correction (AVV code), sequence corrected silently
        const first = results[0];
        expect(first.getEntryFor('pathogen_avv').errors.length).toBeGreaterThan(
            0
        );
        expect(first.getEntryFor('sequence_status').value).toBe('QC-PASS');

        // Second sample: everything already correct → no changes
        const second = results[1];
        expect(second.getEntryFor('pathogen_avv').errors).toHaveLength(0);
        expect(second.getEntryFor('sequence_status').errors).toHaveLength(0);
    });
});
