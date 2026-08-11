import { NRL } from '../../../../shared/domain/entities/nrl.entity';
import { NRL_ID_VALUE } from '../../../../shared/domain/valueObjects';
import { NRLCache } from '../../../../shared/infrastructure/cache/nrl.cache';
import { Analysis } from '../../model/legacy.model';
import {
    AnalysisValidationIssue,
    AnalysisValidationSample,
    AnalysisValidationService
} from '../analysis-validation.service';
import { NRLService } from '../nrl.service';

// Procedure keys as used by NRLService.setValueForAnalysisKey.
const SPECIES = 0;
const SEROLOGICAL = 1;
const RESISTANCE = 2;

function makeNRLConfig(
    nrlId: NRL_ID_VALUE,
    standardKeys: number[] = [],
    optionalKeys: number[] = []
): NRL {
    return NRL.create({
        nrlId,
        selectors: [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        email: null as any,
        standardProcedures: standardKeys.map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            k => ({ key: k, value: 'std' } as any)
        ),
        optionalProcedures: optionalKeys.map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            k => ({ key: k, value: 'opt' } as any)
        )
    });
}

function makeService(nrls: NRL[]): AnalysisValidationService {
    const cache = {
        getNRLList: jest.fn().mockReturnValue(nrls),
        getNRLById: jest.fn((id: NRL_ID_VALUE) =>
            nrls.find(n => n.nrlId === id)
        ),
        setNRLs: jest.fn(),
        removeAllData: jest.fn()
    } as unknown as jest.Mocked<NRLCache>;
    return new AnalysisValidationService(new NRLService(cache));
}

function makeSample(
    position: number,
    nrl: NRL_ID_VALUE,
    analysis: Partial<Analysis>
): AnalysisValidationSample {
    return { position, nrl, analysis };
}

// NRL-Salm: species is standard, serological and resistance are optional.
const SALM = makeNRLConfig(
    NRL_ID_VALUE.NRL_Salm,
    [SPECIES],
    [SEROLOGICAL, RESISTANCE]
);
// NRL-Campy: species is standard, nothing optional.
const CAMPY = makeNRLConfig(NRL_ID_VALUE.NRL_Campy, [SPECIES], []);

describe('AnalysisValidationService', () => {
    describe('samples of the same NRL requesting different analysis', () => {
        it('is reported as not supported', () => {
            const service = makeService([SALM]);

            const findings = service.validate([
                makeSample(1, NRL_ID_VALUE.NRL_Salm, { serological: true }),
                makeSample(2, NRL_ID_VALUE.NRL_Salm, { serological: false })
            ]);

            expect(findings).toHaveLength(1);
            expect(findings[0].issue).toBe(
                AnalysisValidationIssue.DIFFERENT_ANALYSIS_FOR_SAME_NRL
            );
            expect(findings[0].nrl).toBe(NRL_ID_VALUE.NRL_Salm);
        });

        it('names the deviating sample and the one that would have won', () => {
            const service = makeService([SALM]);

            const findings = service.validate([
                makeSample(1, NRL_ID_VALUE.NRL_Salm, { resistance: true }),
                makeSample(2, NRL_ID_VALUE.NRL_Salm, { resistance: true }),
                makeSample(3, NRL_ID_VALUE.NRL_Salm, { resistance: false })
            ]);

            expect(findings[0].samples).toEqual([1, 3]);
            expect(findings[0].message).toContain('not supported');
            expect(findings[0].message).toContain('1, 3');
        });

        it('reports differing free text too', () => {
            const service = makeService([SALM]);

            const findings = service.validate([
                makeSample(1, NRL_ID_VALUE.NRL_Salm, { other: 'extra test' }),
                makeSample(2, NRL_ID_VALUE.NRL_Salm, { other: '' })
            ]);

            expect(findings).toHaveLength(1);
            expect(findings[0].issue).toBe(
                AnalysisValidationIssue.DIFFERENT_ANALYSIS_FOR_SAME_NRL
            );
        });

        it('reports differing compareHuman requests', () => {
            const service = makeService([SALM]);

            const findings = service.validate([
                makeSample(1, NRL_ID_VALUE.NRL_Salm, {
                    compareHuman: { active: true, value: 'case 7' }
                }),
                makeSample(2, NRL_ID_VALUE.NRL_Salm, {
                    compareHuman: { active: false, value: '' }
                })
            ]);

            expect(findings).toHaveLength(1);
            expect(findings[0].issue).toBe(
                AnalysisValidationIssue.DIFFERENT_ANALYSIS_FOR_SAME_NRL
            );
        });
    });

    describe('analysis that is consistent for the NRL', () => {
        it('passes when every sample requests the same procedures', () => {
            const service = makeService([SALM]);

            const findings = service.validate([
                makeSample(1, NRL_ID_VALUE.NRL_Salm, { serological: true }),
                makeSample(2, NRL_ID_VALUE.NRL_Salm, { serological: true })
            ]);

            expect(findings).toEqual([]);
        });

        it('treats an omitted analysis as "nothing optional requested"', () => {
            const service = makeService([SALM]);

            const findings = service.validate([
                makeSample(1, NRL_ID_VALUE.NRL_Salm, {}),
                makeSample(2, NRL_ID_VALUE.NRL_Salm, {
                    serological: false,
                    resistance: false
                })
            ]);

            expect(findings).toEqual([]);
        });

        it('ignores disagreement about a standard procedure, which is forced on anyway', () => {
            const service = makeService([SALM]);

            const findings = service.validate([
                makeSample(1, NRL_ID_VALUE.NRL_Salm, { species: true }),
                makeSample(2, NRL_ID_VALUE.NRL_Salm, { species: false })
            ]);

            expect(findings).toEqual([]);
        });

        it('compares each NRL group on its own', () => {
            const service = makeService([SALM, CAMPY]);

            const findings = service.validate([
                makeSample(1, NRL_ID_VALUE.NRL_Salm, { serological: true }),
                makeSample(2, NRL_ID_VALUE.NRL_Campy, {}),
                makeSample(3, NRL_ID_VALUE.NRL_Salm, { serological: true })
            ]);

            expect(findings).toEqual([]);
        });
    });

    describe('procedures the NRL does not offer', () => {
        it('is reported with the procedure and the sample', () => {
            const service = makeService([CAMPY]);

            const findings = service.validate([
                makeSample(1, NRL_ID_VALUE.NRL_Campy, { vaccination: true })
            ]);

            expect(findings).toHaveLength(1);
            expect(findings[0].issue).toBe(
                AnalysisValidationIssue.PROCEDURE_NOT_OFFERED_BY_NRL
            );
            expect(findings[0].procedures).toEqual(['vaccination']);
            expect(findings[0].samples).toEqual([1]);
            expect(findings[0].message).toContain('not offered by');
        });

        it('is not reported when the procedure is merely switched off', () => {
            const service = makeService([CAMPY]);

            const findings = service.validate([
                makeSample(1, NRL_ID_VALUE.NRL_Campy, { vaccination: false })
            ]);

            expect(findings).toEqual([]);
        });

        it('accepts the free-text fields for every NRL', () => {
            const service = makeService([CAMPY]);

            const findings = service.validate([
                makeSample(1, NRL_ID_VALUE.NRL_Campy, {
                    other: 'please also check this',
                    compareHuman: { active: true, value: 'case 7' }
                })
            ]);

            expect(findings).toEqual([]);
        });

        it('collects every unsupported procedure of the group into one finding', () => {
            const service = makeService([CAMPY]);

            const findings = service.validate([
                makeSample(1, NRL_ID_VALUE.NRL_Campy, { vaccination: true }),
                makeSample(2, NRL_ID_VALUE.NRL_Campy, {
                    vaccination: true,
                    resistance: true
                })
            ]);

            const unsupported = findings.filter(
                f =>
                    f.issue ===
                    AnalysisValidationIssue.PROCEDURE_NOT_OFFERED_BY_NRL
            );
            expect(unsupported).toHaveLength(1);
            expect(unsupported[0].procedures).toEqual([
                'resistance',
                'vaccination'
            ]);
            expect(unsupported[0].samples).toEqual([1, 2]);
        });
    });

    describe('NRL that could not be determined', () => {
        it('is skipped, because nothing is known about its procedures', () => {
            const service = makeService([SALM]);

            const findings = service.validate([
                makeSample(1, NRL_ID_VALUE.UNKNOWN, { serological: true }),
                makeSample(2, NRL_ID_VALUE.UNKNOWN, { vaccination: true })
            ]);

            expect(findings).toEqual([]);
        });
    });

    it('reports both problems when a group has each', () => {
        const service = makeService([SALM]);

        const findings = service.validate([
            makeSample(1, NRL_ID_VALUE.NRL_Salm, { serological: true }),
            makeSample(2, NRL_ID_VALUE.NRL_Salm, { vaccination: true })
        ]);

        expect(findings.map(f => f.issue).sort()).toEqual([
            AnalysisValidationIssue.DIFFERENT_ANALYSIS_FOR_SAME_NRL,
            AnalysisValidationIssue.PROCEDURE_NOT_OFFERED_BY_NRL
        ]);
    });

    it('passes an empty order', () => {
        const service = makeService([SALM]);

        expect(service.validate([])).toEqual([]);
    });
});
