import { NRL_ID_VALUE } from '../../../../shared/domain/valueObjects';
import { NRL } from '../../../../shared/domain/entities/nrl.entity';
import { NRLCache } from '../../../../shared/infrastructure/cache/nrl.cache';
import { NRLService } from '../nrl.service';
import { Sample } from '../../model/sample.entity';
import {
    AnnotatedSampleDataEntry,
    SampleData,
    Urgency
} from '../../model/legacy.model';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(value = ''): AnnotatedSampleDataEntry {
    return { value, errors: [], correctionOffer: [] };
}

function makeSampleData(pathogen = ''): SampleData {
    return {
        sample_id: makeEntry(),
        sample_id_avv: makeEntry(),
        partial_sample_id: makeEntry(),
        pathogen_avv: makeEntry(pathogen),
        pathogen_text: makeEntry(),
        sequence_id: makeEntry(),
        sequence_status: makeEntry(),
        sampling_date: makeEntry(),
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

function makeSampleMeta() {
    return {
        nrl: NRL_ID_VALUE.UNKNOWN,
        urgency: Urgency.NORMAL,
        analysis: {}
    };
}

function makeNRLConfig(
    nrlId: NRL_ID_VALUE,
    selectors: string[],
    standardKeys: number[] = [],
    optionalKeys: number[] = []
): NRL {
    return NRL.create({
        nrlId,
        selectors,
        email: null as any,
        standardProcedures: standardKeys.map(
            k => ({ key: k, value: 'std' } as any)
        ),
        optionalProcedures: optionalKeys.map(
            k => ({ key: k, value: 'opt' } as any)
        )
    });
}

function makeMockCache(nrls: NRL[]): jest.Mocked<NRLCache> {
    return {
        getNRLList: jest.fn().mockReturnValue(nrls),
        getNRLById: jest.fn((id: NRL_ID_VALUE) =>
            nrls.find(n => n.nrlId === id)
        ),
        setNRLs: jest.fn(),
        removeAllData: jest.fn()
    } as unknown as jest.Mocked<NRLCache>;
}

// ---------------------------------------------------------------------------
// getNRLForPathogen
// ---------------------------------------------------------------------------

describe('NRLService.getNRLForPathogen', () => {
    it('returns UNKNOWN for an empty string', () => {
        const cache = makeMockCache([]);
        const svc = new NRLService(cache);
        expect(svc.getNRLForPathogen('')).toBe(NRL_ID_VALUE.UNKNOWN);
    });

    it('returns UNKNOWN for undefined/null-like falsy value', () => {
        const cache = makeMockCache([]);
        const svc = new NRLService(cache);
        expect(svc.getNRLForPathogen(null as any)).toBe(NRL_ID_VALUE.UNKNOWN);
    });

    it('returns the correct NRL ID when pathogen matches a selector regex', () => {
        const nrl = makeNRLConfig(NRL_ID_VALUE.NRL_Salm, ['Salmonella']);
        const cache = makeMockCache([nrl]);
        const svc = new NRLService(cache);
        expect(svc.getNRLForPathogen('Salmonella spp.')).toBe(
            NRL_ID_VALUE.NRL_Salm
        );
    });

    it('matching is case-insensitive', () => {
        const nrl = makeNRLConfig(NRL_ID_VALUE.NRL_Salm, ['salmonella']);
        const cache = makeMockCache([nrl]);
        const svc = new NRLService(cache);
        expect(svc.getNRLForPathogen('SALMONELLA enterica')).toBe(
            NRL_ID_VALUE.NRL_Salm
        );
    });

    it('returns UNKNOWN when no selector matches the pathogen', () => {
        const nrl = makeNRLConfig(NRL_ID_VALUE.NRL_Campy, ['Campylobacter']);
        const cache = makeMockCache([nrl]);
        const svc = new NRLService(cache);
        expect(svc.getNRLForPathogen('Listeria monocytogenes')).toBe(
            NRL_ID_VALUE.UNKNOWN
        );
    });

    it('returns the first matching NRL when multiple NRLs could match', () => {
        const nrl1 = makeNRLConfig(NRL_ID_VALUE.NRL_AR, ['coli']);
        const nrl2 = makeNRLConfig(NRL_ID_VALUE.NRL_VTEC, ['Escherichia coli']);
        const cache = makeMockCache([nrl1, nrl2]);
        const svc = new NRLService(cache);
        // 'coli' matches nrl1 first
        expect(svc.getNRLForPathogen('Escherichia coli')).toBe(
            NRL_ID_VALUE.NRL_AR
        );
    });

    it('uses the regex pattern correctly (full match not required)', () => {
        const nrl = makeNRLConfig(NRL_ID_VALUE.NRL_Listeria, ['Listeria']);
        const cache = makeMockCache([nrl]);
        const svc = new NRLService(cache);
        expect(svc.getNRLForPathogen('Listeria monocytogenes serovar 4b')).toBe(
            NRL_ID_VALUE.NRL_Listeria
        );
    });
});

// ---------------------------------------------------------------------------
// isPathogenRelevantForBfR
// ---------------------------------------------------------------------------

describe('NRLService.isPathogenRelevantForBfR', () => {
    it('returns true when the pathogen matches a current NRL selector', () => {
        const nrl = makeNRLConfig(NRL_ID_VALUE.NRL_Salm, ['Salmonella']);
        const cache = makeMockCache([nrl]);
        const svc = new NRLService(cache);
        expect(svc.isPathogenRelevantForBfR('Salmonella spp.')).toBe(true);
    });

    it('returns false when no NRL selector matches the pathogen', () => {
        const nrl = makeNRLConfig(NRL_ID_VALUE.NRL_Campy, ['Campylobacter']);
        const cache = makeMockCache([nrl]);
        const svc = new NRLService(cache);
        expect(svc.isPathogenRelevantForBfR('Listeria monocytogenes')).toBe(
            false
        );
    });

    it('returns false for an empty value', () => {
        const cache = makeMockCache([]);
        const svc = new NRLService(cache);
        expect(svc.isPathogenRelevantForBfR('')).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// assignNRLsToSamples
// ---------------------------------------------------------------------------

describe('NRLService.assignNRLsToSamples', () => {
    it('returns the same number of samples as input', () => {
        const cache = makeMockCache([]);
        const svc = new NRLService(cache);
        const samples = [
            Sample.create(makeSampleData('Salmonella'), makeSampleMeta()),
            Sample.create(makeSampleData('Listeria'), makeSampleMeta())
        ];
        const result = svc.assignNRLsToSamples(samples);
        expect(result).toHaveLength(2);
    });

    it('sets the NRL on each sample based on getNRLForPathogen', () => {
        const nrl = makeNRLConfig(NRL_ID_VALUE.NRL_Salm, ['Salmonella']);
        const cache = makeMockCache([nrl]);
        const svc = new NRLService(cache);
        const sample = Sample.create(
            makeSampleData('Salmonella spp.'),
            makeSampleMeta()
        );
        const [result] = svc.assignNRLsToSamples([sample]);
        expect(result.getNRL()).toBe(NRL_ID_VALUE.NRL_Salm);
    });

    it('assigns UNKNOWN when pathogen does not match any selector', () => {
        const nrl = makeNRLConfig(NRL_ID_VALUE.NRL_Campy, ['Campylobacter']);
        const cache = makeMockCache([nrl]);
        const svc = new NRLService(cache);
        const sample = Sample.create(
            makeSampleData('Unknown pathogen'),
            makeSampleMeta()
        );
        const [result] = svc.assignNRLsToSamples([sample]);
        expect(result.getNRL()).toBe(NRL_ID_VALUE.UNKNOWN);
    });

    it('does not mutate the original sample (uses clone)', () => {
        const nrl = makeNRLConfig(NRL_ID_VALUE.NRL_Salm, ['Salmonella']);
        const cache = makeMockCache([nrl]);
        const svc = new NRLService(cache);
        const original = Sample.create(
            makeSampleData('Salmonella'),
            makeSampleMeta()
        );
        const originalNRL = original.getNRL();
        svc.assignNRLsToSamples([original]);
        // Original NRL should still be UNKNOWN (the returned sample is a clone)
        expect(original.getNRL()).toBe(originalNRL);
    });

    it('returns empty array for empty input', () => {
        const cache = makeMockCache([]);
        const svc = new NRLService(cache);
        expect(svc.assignNRLsToSamples([])).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// getOptionalAnalysisFor
// ---------------------------------------------------------------------------

describe('NRLService.getOptionalAnalysisFor', () => {
    it('returns empty object when NRL is not found in cache', () => {
        const cache = makeMockCache([]);
        const svc = new NRLService(cache);
        const result = svc.getOptionalAnalysisFor(NRL_ID_VALUE.NRL_AR);
        expect(result).toEqual({});
    });

    it('returns analysis with false for each optional procedure key', () => {
        // key 0 = species, key 1 = serological
        const nrl = makeNRLConfig(
            NRL_ID_VALUE.NRL_AR,
            ['Selecto'],
            [], // no standard
            [0, 1] // optional keys
        );
        const cache = makeMockCache([nrl]);
        const svc = new NRLService(cache);
        const result = svc.getOptionalAnalysisFor(NRL_ID_VALUE.NRL_AR);
        expect(result.species).toBe(false);
        expect(result.serological).toBe(false);
    });

    it('does not include standard procedures in optional analysis', () => {
        const nrl = makeNRLConfig(NRL_ID_VALUE.NRL_AR, ['X'], [2], [0]);
        const cache = makeMockCache([nrl]);
        const svc = new NRLService(cache);
        const result = svc.getOptionalAnalysisFor(NRL_ID_VALUE.NRL_AR);
        // key 2 = resistance (standard), should not appear in optional result
        expect(result.resistance).toBeUndefined();
        // key 0 = species (optional), should be false
        expect(result.species).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// getStandardAnalysisFor
// ---------------------------------------------------------------------------

describe('NRLService.getStandardAnalysisFor', () => {
    it('returns empty object when NRL is not found in cache', () => {
        const cache = makeMockCache([]);
        const svc = new NRLService(cache);
        const result = svc.getStandardAnalysisFor(NRL_ID_VALUE.NRL_Campy);
        expect(result).toEqual({});
    });

    it('returns analysis with true for each standard procedure key', () => {
        // key 0 = species, key 2 = resistance
        const nrl = makeNRLConfig(NRL_ID_VALUE.NRL_AR, ['X'], [0, 2], []);
        const cache = makeMockCache([nrl]);
        const svc = new NRLService(cache);
        const result = svc.getStandardAnalysisFor(NRL_ID_VALUE.NRL_AR);
        expect(result.species).toBe(true);
        expect(result.resistance).toBe(true);
    });

    it('does not include optional procedures in standard analysis', () => {
        const nrl = makeNRLConfig(NRL_ID_VALUE.NRL_AR, ['X'], [0], [1]);
        const cache = makeMockCache([nrl]);
        const svc = new NRLService(cache);
        const result = svc.getStandardAnalysisFor(NRL_ID_VALUE.NRL_AR);
        // key 1 = serological (optional), should not appear
        expect(result.serological).toBeUndefined();
    });

    it('maps all 8 known analysis keys to true when all are standard procedures', () => {
        const nrl = makeNRLConfig(
            NRL_ID_VALUE.NRL_AR,
            ['X'],
            [0, 1, 2, 3, 4, 5, 6, 7],
            []
        );
        const cache = makeMockCache([nrl]);
        const svc = new NRLService(cache);
        const result = svc.getStandardAnalysisFor(NRL_ID_VALUE.NRL_AR);
        expect(result.species).toBe(true);
        expect(result.serological).toBe(true);
        expect(result.resistance).toBe(true);
        expect(result.vaccination).toBe(true);
        expect(result.molecularTyping).toBe(true);
        expect(result.toxin).toBe(true);
        expect(result.esblAmpCCarbapenemasen).toBe(true);
        expect(result.sample).toBe(true);
    });
});
