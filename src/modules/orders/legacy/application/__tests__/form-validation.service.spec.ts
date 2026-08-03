import { NRL_ID_VALUE } from '../../../../shared/domain/valueObjects';
import {
    AnnotatedSampleDataEntry,
    SampleData,
    Urgency,
    ValidationError
} from '../../model/legacy.model';
import { Sample } from '../../model/sample.entity';
import { FormValidatorService } from '../form-validation.service';

// ---------------------------------------------------------------------------
// Mock createValidator so the constructor succeeds without a real catalog
// ---------------------------------------------------------------------------

jest.mock('../../model/validator.entity', () => ({
    createValidator: jest.fn().mockReturnValue({
        validateSample: jest.fn().mockReturnValue({})
    })
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(value = ''): AnnotatedSampleDataEntry {
    return { value, errors: [], correctionOffer: [] };
}

/**
 * Build a minimal SampleData.
 * By default all fields are empty.  Override specific fields via `fields`.
 */
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
        sampling_date: v('sampling_date'),
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
    return { nrl: NRL_ID_VALUE.UNKNOWN, urgency: Urgency.NORMAL, analysis: {} };
}

const MOCK_ERROR: ValidationError = {
    code: 3,
    level: 2,
    message: 'Duplicate ID'
};

function makeService() {
    const mockCatalogService = {
        getZomoPlan: jest.fn().mockReturnValue(null),
        getAVVCatalog: jest.fn().mockReturnValue({
            getAVV313EintragWithAVVKode: jest.fn().mockReturnValue(undefined)
        }),
        getPLZCatalog: jest.fn(),
        getCatalogSearchAliases: jest.fn().mockReturnValue([])
    };
    const mockAVVFormatProvider = { getFormat: jest.fn().mockReturnValue([]) };
    const mockValidationErrorProvider = {
        getError: jest.fn().mockReturnValue(MOCK_ERROR)
    };

    return {
        service: new FormValidatorService(
            mockCatalogService as any,
            mockAVVFormatProvider as any,
            mockValidationErrorProvider as any
        ),
        mockValidationErrorProvider,
        mockAVVFormatProvider
    };
}

/** Helper to count errors on a specific field. */
function errorCount(sample: Sample, field: string): number {
    return sample.getEntryFor(field as any).errors.length;
}

// ---------------------------------------------------------------------------
// validateSamples — individual validation (delegate to mocked validator)
// ---------------------------------------------------------------------------

describe('FormValidatorService.validateSamples — individual validation', () => {
    it('returns the same number of samples as provided', async () => {
        const { service } = makeService();
        const samples = [
            Sample.create(makeSampleData(), makeMeta()),
            Sample.create(makeSampleData(), makeMeta())
        ];
        const result = await service.validateSamples(samples, {});
        expect(result).toHaveLength(2);
    });

    it('returns empty array for empty input', async () => {
        const { service } = makeService();
        const result = await service.validateSamples([], {});
        expect(result).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// validateSamples — duplicate sample_id detection (error code 3)
// ---------------------------------------------------------------------------

describe('FormValidatorService — duplicate sample_id detection (error 3)', () => {
    /**
     * pathogenId is non-undefined only when:
     *   sample_id is set, sample_id_avv is empty, partial_sample_id is empty, pathogen_avv is set
     */
    function makeSampleWithId(sampleId: string, pathogen: string): Sample {
        return Sample.create(
            makeSampleData({ sample_id: sampleId, pathogen_avv: pathogen }),
            makeMeta()
        );
    }

    it('adds error to sample_id of ALL duplicates', async () => {
        const { service, mockValidationErrorProvider } = makeService();
        mockValidationErrorProvider.getError.mockReturnValue({
            code: 3,
            level: 2,
            message: 'Duplicate sample_id'
        });

        const s1 = makeSampleWithId('S001', 'Salmonella');
        const s2 = makeSampleWithId('S001', 'Salmonella');
        const results = await service.validateSamples([s1, s2], {});

        expect(errorCount(results[0], 'sample_id')).toBeGreaterThan(0);
        expect(errorCount(results[1], 'sample_id')).toBeGreaterThan(0);
    });

    it('does NOT add error when all sample_ids are unique', async () => {
        const { service } = makeService();
        const s1 = makeSampleWithId('S001', 'Salmonella');
        const s2 = makeSampleWithId('S002', 'Salmonella');
        const results = await service.validateSamples([s1, s2], {});

        expect(errorCount(results[0], 'sample_id')).toBe(0);
        expect(errorCount(results[1], 'sample_id')).toBe(0);
    });

    it('does NOT flag uniqueness when pathogenId is undefined (avv field set)', async () => {
        const { service } = makeService();
        // sample_id_avv is set → pathogenId returns undefined → not considered a duplicate
        const s1 = Sample.create(
            makeSampleData({
                sample_id: 'S001',
                sample_id_avv: 'AVV1',
                pathogen_avv: 'E. coli'
            }),
            makeMeta()
        );
        const s2 = Sample.create(
            makeSampleData({
                sample_id: 'S001',
                sample_id_avv: 'AVV1',
                pathogen_avv: 'E. coli'
            }),
            makeMeta()
        );
        const results = await service.validateSamples([s1, s2], {});
        expect(errorCount(results[0], 'sample_id')).toBe(0);
        expect(errorCount(results[1], 'sample_id')).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// validateSamples — duplicate sample_id_avv detection (error code 6)
// ---------------------------------------------------------------------------

describe('FormValidatorService — duplicate sample_id_avv detection (error 6)', () => {
    /**
     * pathogenIdAVV is non-undefined only when:
     *   sample_id is empty, sample_id_avv is set, partial_sample_id is empty, pathogen_avv is set
     */
    function makeSampleWithAvvId(
        sampleIdAvv: string,
        pathogen: string
    ): Sample {
        return Sample.create(
            makeSampleData({
                sample_id_avv: sampleIdAvv,
                pathogen_avv: pathogen
            }),
            makeMeta()
        );
    }

    it('adds error to sample_id_avv of ALL duplicates', async () => {
        const { service, mockValidationErrorProvider } = makeService();
        mockValidationErrorProvider.getError.mockReturnValue({
            code: 6,
            level: 2,
            message: 'Duplicate AVV id'
        });

        const s1 = makeSampleWithAvvId('17-L-00001-1-1', 'Salmonella');
        const s2 = makeSampleWithAvvId('17-L-00001-1-1', 'Salmonella');
        const results = await service.validateSamples([s1, s2], {});

        expect(errorCount(results[0], 'sample_id_avv')).toBeGreaterThan(0);
        expect(errorCount(results[1], 'sample_id_avv')).toBeGreaterThan(0);
    });

    it('does NOT add error when all sample_id_avv values are unique', async () => {
        const { service } = makeService();
        const s1 = makeSampleWithAvvId('17-L-00001-1-1', 'Salmonella');
        const s2 = makeSampleWithAvvId('17-L-00002-1-1', 'Salmonella');
        const results = await service.validateSamples([s1, s2], {});

        expect(errorCount(results[0], 'sample_id_avv')).toBe(0);
        expect(errorCount(results[1], 'sample_id_avv')).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// validateSamples — duplicate (sample_id, partial_sample_id) detection (error 120)
// ---------------------------------------------------------------------------

describe('FormValidatorService — duplicate (sample_id + partial_sample_id) detection (error 120)', () => {
    /**
     * pathogenIdIdPartial is non-undefined only when:
     *   sample_id is set, sample_id_avv is empty, partial_sample_id is set, pathogen_avv is set
     */
    function makePartialSample(
        sampleId: string,
        partial: string,
        pathogen: string
    ): Sample {
        return Sample.create(
            makeSampleData({
                sample_id: sampleId,
                partial_sample_id: partial,
                pathogen_avv: pathogen
            }),
            makeMeta()
        );
    }

    it('adds errors to both sample_id and partial_sample_id for duplicates', async () => {
        const { service, mockValidationErrorProvider } = makeService();
        mockValidationErrorProvider.getError.mockReturnValue({
            code: 120,
            level: 2,
            message: 'Duplicate partial combo'
        });

        const s1 = makePartialSample('S001', 'P1', 'Salmonella');
        const s2 = makePartialSample('S001', 'P1', 'Salmonella');
        const results = await service.validateSamples([s1, s2], {});

        expect(errorCount(results[0], 'sample_id')).toBeGreaterThan(0);
        expect(errorCount(results[0], 'partial_sample_id')).toBeGreaterThan(0);
        expect(errorCount(results[1], 'sample_id')).toBeGreaterThan(0);
        expect(errorCount(results[1], 'partial_sample_id')).toBeGreaterThan(0);
    });

    it('does NOT add error when partial combos are unique', async () => {
        const { service } = makeService();
        const s1 = makePartialSample('S001', 'P1', 'Salmonella');
        const s2 = makePartialSample('S001', 'P2', 'Salmonella');
        const results = await service.validateSamples([s1, s2], {});

        expect(errorCount(results[0], 'sample_id')).toBe(0);
        expect(errorCount(results[1], 'sample_id')).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// validateSamples — duplicate (sample_id_avv, partial_sample_id) detection (error 121)
// ---------------------------------------------------------------------------

describe('FormValidatorService — duplicate (sample_id_avv + partial_sample_id) detection (error 121)', () => {
    /**
     * pathogenIdAVVPartial is non-undefined only when:
     *   sample_id is empty, sample_id_avv is set, partial_sample_id is set, pathogen_avv is set
     */
    function makeAvvPartialSample(
        idAvv: string,
        partial: string,
        pathogen: string
    ): Sample {
        return Sample.create(
            makeSampleData({
                sample_id_avv: idAvv,
                partial_sample_id: partial,
                pathogen_avv: pathogen
            }),
            makeMeta()
        );
    }

    it('adds errors to sample_id_avv and partial_sample_id for duplicates', async () => {
        const { service, mockValidationErrorProvider } = makeService();
        mockValidationErrorProvider.getError.mockReturnValue({
            code: 121,
            level: 2,
            message: 'Duplicate AVV+partial'
        });

        const s1 = makeAvvPartialSample('17-L-00001', 'P1', 'Salmonella');
        const s2 = makeAvvPartialSample('17-L-00001', 'P1', 'Salmonella');
        const results = await service.validateSamples([s1, s2], {});

        expect(errorCount(results[0], 'sample_id_avv')).toBeGreaterThan(0);
        expect(errorCount(results[0], 'partial_sample_id')).toBeGreaterThan(0);
        expect(errorCount(results[1], 'sample_id_avv')).toBeGreaterThan(0);
        expect(errorCount(results[1], 'partial_sample_id')).toBeGreaterThan(0);
    });

    it('does NOT add error when AVV+partial combos are unique', async () => {
        const { service } = makeService();
        const s1 = makeAvvPartialSample('17-L-00001', 'P1', 'Salmonella');
        const s2 = makeAvvPartialSample('17-L-00002', 'P1', 'Salmonella');
        const results = await service.validateSamples([s1, s2], {});

        expect(errorCount(results[0], 'sample_id_avv')).toBe(0);
        expect(errorCount(results[1], 'sample_id_avv')).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// validateSamples — skip batch check for single sample
// ---------------------------------------------------------------------------

describe('FormValidatorService — single sample skips batch duplicate check', () => {
    it('returns a single sample without any duplicate errors', async () => {
        const { service } = makeService();
        const s = Sample.create(
            makeSampleData({ sample_id: 'S001', pathogen_avv: 'E. coli' }),
            makeMeta()
        );
        const results = await service.validateSamples([s], {});
        expect(results).toHaveLength(1);
        expect(errorCount(results[0], 'sample_id')).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// AVV id format (error 72) — the state-specific regex must always be installed
// ---------------------------------------------------------------------------

describe('FormValidatorService — AVV id format regex', () => {
    // Reaches into the mocked validator to read the constraint set the service
    // actually handed over for a sample.
    function constraintsPassedToValidator() {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { createValidator } = require('../../model/validator.entity');
        const validateSample = createValidator().validateSample as jest.Mock;
        return validateSample.mock.calls[0][1];
    }

    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { createValidator } = require('../../model/validator.entity');
        (createValidator().validateSample as jest.Mock).mockClear();
    });

    it('installs the AVV formats when a state is given', async () => {
        const { service, mockAVVFormatProvider } = makeService();
        mockAVVFormatProvider.getFormat.mockReturnValue(['^yy[0-9]{7}$']);

        await service.validateSamples(
            [Sample.create(makeSampleData(), makeMeta())],
            { state: 'HE' }
        );

        expect(mockAVVFormatProvider.getFormat).toHaveBeenCalledWith('HE');
        expect(
            constraintsPassedToValidator()['sample_id_avv'][
                'matchesIdToSpecificYear'
            ].regex
        ).toEqual(['^yy[0-9]{7}$']);
    });

    it('installs the AVV formats when NO state is given', async () => {
        // Regression guard: `getFormat()` returns the formats of every state when
        // called without one. Skipping setStateSpecificConstraints for an empty
        // state left `regex: []` in place, which makes matchesRegexPattern bail out
        // and error 72 unreachable for anonymous validation requests.
        const { service, mockAVVFormatProvider } = makeService();
        mockAVVFormatProvider.getFormat.mockReturnValue([
            '^yy[0-9]{7}$',
            '^yyyy-[0-9]{7}$'
        ]);

        await service.validateSamples(
            [Sample.create(makeSampleData(), makeMeta())],
            { state: '' }
        );

        expect(mockAVVFormatProvider.getFormat).toHaveBeenCalledWith('');
        expect(
            constraintsPassedToValidator()['sample_id_avv'][
                'matchesIdToSpecificYear'
            ].regex
        ).toEqual(['^yy[0-9]{7}$', '^yyyy-[0-9]{7}$']);
    });
});
