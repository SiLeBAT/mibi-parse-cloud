import { NRL_ID_VALUE } from '../../../../shared/domain/valueObjects';
import {
    AnnotatedSampleDataEntry,
    CorrectionSuggestions,
    SampleData,
    Urgency,
    ValidationError
} from '../../model/legacy.model';
import { Sample } from '../../model/sample.entity';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(value = ''): AnnotatedSampleDataEntry {
    return { value, errors: [], correctionOffer: [] };
}

function makeSampleData(
    fields: Partial<Record<string, string>> = {}
): SampleData {
    const v = (key: string) => makeEntry(fields[key] ?? '');
    return {
        sample_id: v('sample_id'),
        sample_id_avv: v('sample_id_avv'),
        partial_sample_id: v('partial_sample_id'),
        pathogen_avv: v('pathogen_avv'),
        pathogen_text: makeEntry(),
        sequence_id: makeEntry(),
        sequence_status: makeEntry(),
        sampling_date: makeEntry(),
        isolation_date: makeEntry(),
        sampling_location_avv: v('sampling_location_avv'),
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

function makeMeta(nrl = NRL_ID_VALUE.UNKNOWN, urgency = Urgency.NORMAL) {
    return { nrl, urgency, analysis: {} };
}

const ERR: ValidationError = { code: 1, level: 1, message: 'test-err' };

// ---------------------------------------------------------------------------
// create — trims whitespace
// ---------------------------------------------------------------------------

describe('Sample.create', () => {
    it('trims leading/trailing whitespace from field values', () => {
        const s = Sample.create(
            makeSampleData({ sample_id: '  S001  ' }),
            makeMeta()
        );
        expect(s.getValueFor('sample_id')).toBe('S001');
    });
});

// ---------------------------------------------------------------------------
// getObjectId
// ---------------------------------------------------------------------------

describe('Sample.getObjectId', () => {
    it('returns the objectId passed to create', () => {
        const s = Sample.create(makeSampleData(), makeMeta(), 'obj-123');
        expect(s.getObjectId()).toBe('obj-123');
    });

    it('returns empty string when no objectId is provided', () => {
        const s = Sample.create(makeSampleData(), makeMeta());
        expect(s.getObjectId()).toBe('');
    });
});

// ---------------------------------------------------------------------------
// getDataEntries
// ---------------------------------------------------------------------------

describe('Sample.getDataEntries', () => {
    it('returns an object with only value fields (no errors or correctionOffer)', () => {
        const s = Sample.create(
            makeSampleData({ sample_id: 'S001' }),
            makeMeta()
        );
        const entries = s.getDataEntries();
        expect(entries['sample_id']).toEqual({ value: 'S001' });
        expect((entries['sample_id'] as any).errors).toBeUndefined();
    });

    it('covers all 24 sample fields', () => {
        const s = Sample.create(makeSampleData(), makeMeta());
        const entries = s.getDataEntries();
        expect(Object.keys(entries)).toHaveLength(24);
    });
});

// ---------------------------------------------------------------------------
// getOldValues
// ---------------------------------------------------------------------------

describe('Sample.getOldValues', () => {
    it('returns empty object when no field has an oldValue', () => {
        const s = Sample.create(makeSampleData(), makeMeta());
        expect(s.getOldValues()).toEqual({});
    });

    it('returns only fields that have a defined oldValue', () => {
        const data = makeSampleData();
        data.sample_id.oldValue = 'old-S001';
        const s = Sample.create(data, makeMeta());
        const oldVals = s.getOldValues();
        expect(oldVals['sample_id']).toBe('old-S001');
        expect(Object.keys(oldVals)).toHaveLength(1);
    });
});

// ---------------------------------------------------------------------------
// meta
// ---------------------------------------------------------------------------

describe('Sample.meta', () => {
    it('returns a deep clone of the meta (nrl and urgency)', () => {
        const meta = makeMeta(NRL_ID_VALUE.NRL_Salm, Urgency.URGENT);
        const s = Sample.create(makeSampleData(), meta);
        const retrieved = s.meta;
        expect(retrieved.nrl).toBe(NRL_ID_VALUE.NRL_Salm);
        expect(retrieved.urgency).toBe(Urgency.URGENT);
    });
});

// ---------------------------------------------------------------------------
// addErrors
// ---------------------------------------------------------------------------

describe('Sample.addErrors', () => {
    it('adds errors to the specified field', () => {
        const s = Sample.create(makeSampleData(), makeMeta());
        s.addErrors({ sample_id: [ERR] });
        expect(s.getEntryFor('sample_id').errors).toHaveLength(1);
    });

    it('de-duplicates identical errors on the same field', () => {
        const s = Sample.create(makeSampleData(), makeMeta());
        s.addErrors({ sample_id: [ERR] });
        s.addErrors({ sample_id: [ERR] });
        expect(s.getEntryFor('sample_id').errors).toHaveLength(1);
    });

    it('merges distinct errors on the same field', () => {
        const s = Sample.create(makeSampleData(), makeMeta());
        const err2: ValidationError = { code: 2, level: 2, message: 'second' };
        s.addErrors({ sample_id: [ERR] });
        s.addErrors({ sample_id: [err2] });
        expect(s.getEntryFor('sample_id').errors).toHaveLength(2);
    });

    it('adds errors across multiple fields in one call', () => {
        const s = Sample.create(makeSampleData(), makeMeta());
        s.addErrors({ sample_id: [ERR], pathogen_avv: [ERR] });
        expect(s.getEntryFor('sample_id').errors).toHaveLength(1);
        expect(s.getEntryFor('pathogen_avv').errors).toHaveLength(1);
    });
});

// ---------------------------------------------------------------------------
// getErrorCount
// ---------------------------------------------------------------------------

describe('Sample.getErrorCount', () => {
    it('returns 0 when no errors are present', () => {
        const s = Sample.create(makeSampleData(), makeMeta());
        expect(s.getErrorCount(1)).toBe(0);
    });

    it('counts only errors at the requested level', () => {
        const s = Sample.create(makeSampleData(), makeMeta());
        const lvl1: ValidationError = { code: 1, level: 1, message: 'l1' };
        const lvl2: ValidationError = { code: 2, level: 2, message: 'l2' };
        s.addErrors({ sample_id: [lvl1, lvl2], pathogen_avv: [lvl1] });
        expect(s.getErrorCount(1)).toBe(2);
        expect(s.getErrorCount(2)).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// isValid
// ---------------------------------------------------------------------------

describe('Sample.isValid', () => {
    it('returns false when there are no errors', () => {
        const s = Sample.create(makeSampleData(), makeMeta());
        expect(s.isValid()).toBe(false);
    });

    it('returns true when at least one error exists', () => {
        const s = Sample.create(makeSampleData(), makeMeta());
        s.addErrorTo('sample_id', ERR);
        expect(s.isValid()).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// supplementAVV313Data
// ---------------------------------------------------------------------------

describe('Sample.supplementAVV313Data', () => {
    it('sets nrlData on sampling_location_zip and sampling_location_text', () => {
        const s = Sample.create(makeSampleData(), makeMeta());
        s.supplementAVV313Data('10115', 'Berlin');
        expect(s.getEntryFor('sampling_location_zip').nrlData).toBe('10115');
        expect(s.getEntryFor('sampling_location_text').nrlData).toBe('Berlin');
    });
});

// ---------------------------------------------------------------------------
// addCorrectionTo
// ---------------------------------------------------------------------------

describe('Sample.addCorrectionTo', () => {
    it('appends correction offers to the field entry', () => {
        const s = Sample.create(makeSampleData(), makeMeta());
        s.addCorrectionTo('sample_id', ['opt1', 'opt2']);
        expect(s.getEntryFor('sample_id').correctionOffer).toEqual([
            'opt1',
            'opt2'
        ]);
    });

    it('concatenates onto existing offers', () => {
        const s = Sample.create(makeSampleData(), makeMeta());
        s.addCorrectionTo('sample_id', ['opt1']);
        s.addCorrectionTo('sample_id', ['opt2']);
        expect(s.getEntryFor('sample_id').correctionOffer).toEqual([
            'opt1',
            'opt2'
        ]);
    });
});

// ---------------------------------------------------------------------------
// applySilentSingleCorrectionSuggestion
// ---------------------------------------------------------------------------

describe('Sample.applySilentSingleCorrectionSuggestion', () => {
    it('applies the single offer, sets oldValue, and clears correctionOffer', () => {
        const s = Sample.create(
            makeSampleData({ sample_id: 'old' }),
            makeMeta()
        );
        s.addCorrectionTo('sample_id', ['corrected']);
        const correction: CorrectionSuggestions = {
            field: 'sample_id' as any,
            original: 'old',
            correctionOffer: ['corrected'],
            code: -1
        };
        s.applySilentSingleCorrectionSuggestion(correction);
        expect(s.getEntryFor('sample_id').value).toBe('corrected');
        expect(s.getEntryFor('sample_id').correctionOffer).toHaveLength(0);
        expect(s.getEntryFor('sample_id').oldValue).toBe('old');
    });

    it('does nothing when correctionOffer has more than one entry', () => {
        const s = Sample.create(
            makeSampleData({ sample_id: 'old' }),
            makeMeta()
        );
        s.addCorrectionTo('sample_id', ['opt1', 'opt2']);
        const correction: CorrectionSuggestions = {
            field: 'sample_id' as any,
            original: 'old',
            correctionOffer: ['opt1', 'opt2'],
            code: -1
        };
        s.applySilentSingleCorrectionSuggestion(correction);
        expect(s.getEntryFor('sample_id').value).toBe('old');
        expect(s.getEntryFor('sample_id').correctionOffer).toHaveLength(2);
    });
});

// ---------------------------------------------------------------------------
// applySingleCorrectionSuggestions
// ---------------------------------------------------------------------------

describe('Sample.applySingleCorrectionSuggestions', () => {
    it('auto-applies a single code-88 correction and clears the offer', () => {
        const s = Sample.create(
            makeSampleData({ sample_id: 'old' }),
            makeMeta()
        );
        s.addCorrectionTo('sample_id', ['corrected']);
        s.addErrorTo('sample_id', { code: 88, level: 2, message: 'auto' });
        s.applySingleCorrectionSuggestions();
        expect(s.getEntryFor('sample_id').value).toBe('corrected');
        expect(s.getEntryFor('sample_id').correctionOffer).toHaveLength(0);
    });

    it('does not apply when there are multiple correction offers', () => {
        const s = Sample.create(
            makeSampleData({ sample_id: 'old' }),
            makeMeta()
        );
        s.addCorrectionTo('sample_id', ['opt1', 'opt2']);
        s.addErrorTo('sample_id', { code: 88, level: 2, message: 'auto' });
        s.applySingleCorrectionSuggestions();
        expect(s.getEntryFor('sample_id').value).toBe('old');
    });

    it('does not apply when error code is not 88', () => {
        const s = Sample.create(
            makeSampleData({ sample_id: 'old' }),
            makeMeta()
        );
        s.addCorrectionTo('sample_id', ['corrected']);
        s.addErrorTo('sample_id', { code: 3, level: 2, message: 'other' });
        s.applySingleCorrectionSuggestions();
        expect(s.getEntryFor('sample_id').value).toBe('old');
    });
});

// ---------------------------------------------------------------------------
// setAnalysis / getAnalysis
// ---------------------------------------------------------------------------

describe('Sample.setAnalysis / getAnalysis', () => {
    it('merges user analysis with standard procedures from NRL service', () => {
        const mockNrlService = {
            getStandardAnalysisFor: jest
                .fn()
                .mockReturnValue({ resistance: true }),
            getOptionalAnalysisFor: jest
                .fn()
                .mockReturnValue({ species: false })
        };
        const s = Sample.create(
            makeSampleData(),
            makeMeta(NRL_ID_VALUE.NRL_AR)
        );
        s.setAnalysis(mockNrlService as any, { serological: true });
        const analysis = s.getAnalysis();
        expect(analysis.resistance).toBe(true);
    });

    it('getAnalysis returns a deep clone', () => {
        const s = Sample.create(makeSampleData(), makeMeta());
        const a1 = s.getAnalysis();
        const a2 = s.getAnalysis();
        expect(a1).toEqual(a2);
        expect(a1).not.toBe(a2);
    });
});

// ---------------------------------------------------------------------------
// setUrgency / getUrgency
// ---------------------------------------------------------------------------

describe('Sample.setUrgency / getUrgency', () => {
    it('updates and returns the urgency', () => {
        const s = Sample.create(makeSampleData(), makeMeta());
        expect(s.getUrgency()).toBe(Urgency.NORMAL);
        s.setUrgency(Urgency.URGENT);
        expect(s.getUrgency()).toBe(Urgency.URGENT);
    });
});

// ---------------------------------------------------------------------------
// removeWhiteSpacesInAVVCodeValues
// ---------------------------------------------------------------------------

describe('Sample.removeWhiteSpacesInAVVCodeValues', () => {
    it('removes whitespace from AVV code fields (e.g. sampling_location_avv)', () => {
        const s = Sample.create(
            makeSampleData({ sampling_location_avv: '1 0 0 | 2 0 0 |' }),
            makeMeta()
        );
        s.removeWhiteSpacesInAVVCodeValues();
        expect(s.getValueFor('sampling_location_avv')).toBe('100|200|');
    });

    it('removes whitespace from pathogen_avv when it looks like an AVV code', () => {
        const s = Sample.create(
            makeSampleData({ pathogen_avv: '9 8 7 6 | 1 2 3 4 |' }),
            makeMeta()
        );
        s.removeWhiteSpacesInAVVCodeValues();
        expect(s.getValueFor('pathogen_avv')).toBe('9876|1234|');
    });

    it('does not modify text fields that are not AVV codes', () => {
        const s = Sample.create(
            makeSampleData({ pathogen_avv: 'Escherichia coli' }),
            makeMeta()
        );
        s.removeWhiteSpacesInAVVCodeValues();
        expect(s.getValueFor('pathogen_avv')).toBe('Escherichia coli');
    });
});

// ---------------------------------------------------------------------------
// clone
// ---------------------------------------------------------------------------

describe('Sample.clone', () => {
    it('returns a new Sample with identical field values', () => {
        const s = Sample.create(
            makeSampleData({ sample_id: 'S001' }),
            makeMeta()
        );
        const cloned = s.clone();
        expect(cloned.getValueFor('sample_id')).toBe('S001');
    });

    it('deep-clones — errors added to clone do not affect original', () => {
        const s = Sample.create(makeSampleData(), makeMeta());
        const cloned = s.clone();
        cloned.addErrorTo('sample_id', ERR);
        expect(s.getEntryFor('sample_id').errors).toHaveLength(0);
        expect(cloned.getEntryFor('sample_id').errors).toHaveLength(1);
    });
});

// ---------------------------------------------------------------------------
// pathogenIdIdAVVPartial getter
// ---------------------------------------------------------------------------

describe('Sample.pathogenIdIdAVVPartial', () => {
    it('returns compound key when all three IDs plus pathogen_avv are set', () => {
        const s = Sample.create(
            makeSampleData({
                sample_id: 'S1',
                sample_id_avv: 'A1',
                partial_sample_id: 'P1',
                pathogen_avv: 'Path'
            }),
            makeMeta()
        );
        expect(s.pathogenIdIdAVVPartial).toBe('S1A1P1Path');
    });

    it('returns undefined when partial_sample_id is missing', () => {
        const s = Sample.create(
            makeSampleData({
                sample_id: 'S1',
                sample_id_avv: 'A1',
                pathogen_avv: 'Path'
            }),
            makeMeta()
        );
        expect(s.pathogenIdIdAVVPartial).toBeUndefined();
    });

    it('returns undefined when pathogen_avv is missing', () => {
        const s = Sample.create(
            makeSampleData({
                sample_id: 'S1',
                sample_id_avv: 'A1',
                partial_sample_id: 'P1'
            }),
            makeMeta()
        );
        expect(s.pathogenIdIdAVVPartial).toBeUndefined();
    });
});
