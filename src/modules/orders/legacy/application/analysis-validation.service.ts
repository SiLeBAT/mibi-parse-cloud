import _ from 'lodash';
import { NRL_ID_VALUE } from '../../../shared/domain/valueObjects';
// Imported from the leaf module rather than the infrastructure barrel: this
// service is used by the submit controller, which must not pull in the modules
// that register cloud functions on import.
import { nrlCache } from '../../../shared/infrastructure/cache/nrl.cache';
import { Analysis } from '../model/legacy.model';
import { NRLService } from './nrl.service';

export enum AnalysisValidationIssue {
    DIFFERENT_ANALYSIS_FOR_SAME_NRL = 'DIFFERENT_ANALYSIS_FOR_SAME_NRL',
    PROCEDURE_NOT_OFFERED_BY_NRL = 'PROCEDURE_NOT_OFFERED_BY_NRL'
}

export interface AnalysisValidationSample {
    // 1-based position of the sample in the submitted order, so the caller can
    // point the API user at the offending rows.
    position: number;
    nrl: NRL_ID_VALUE;
    analysis: Partial<Analysis>;
}

export interface AnalysisValidationFinding {
    issue: AnalysisValidationIssue;
    nrl: NRL_ID_VALUE;
    samples: number[];
    procedures: string[];
    message: string;
}

// Free-text additions every NRL accepts; they are not part of the configured
// standard/optional procedures, so the "is this offered?" check skips them.
const ALWAYS_ALLOWED: (keyof Analysis)[] = ['other', 'compareHuman'];

/**
 * Validates the analysis data of a submitted order.
 *
 * The submission builds one sample sheet per NRL and derives that sheet's
 * single analysis section from the *first* sample of the group
 * (SampleSheetService.calcSampleSheetAnalysis). Anything the remaining samples
 * requested is therefore dropped, and procedures an NRL does not offer are
 * silently omitted. Both used to happen without the sender ever learning about
 * it - the client's selection wizard was the only thing preventing it.
 *
 * This service detects those two cases up front so the API can reject the order
 * with a specific message instead of quietly submitting something else.
 */
export class AnalysisValidationService {
    constructor(private nrlService: NRLService) {}

    validate(samples: AnalysisValidationSample[]): AnalysisValidationFinding[] {
        const findings: AnalysisValidationFinding[] = [];

        this.groupByNRL(samples).forEach((group, nrl) => {
            // Nothing is known about an unrecognised NRL, so there is no
            // catalogue of procedures to validate against.
            if (nrl === NRL_ID_VALUE.UNKNOWN) {
                return;
            }
            const unsupported = this.findUnsupportedProcedures(nrl, group);
            if (unsupported) {
                findings.push(unsupported);
            }
            const inconsistent = this.findInconsistentSelection(nrl, group);
            if (inconsistent) {
                findings.push(inconsistent);
            }
        });

        return findings;
    }

    private groupByNRL(
        samples: AnalysisValidationSample[]
    ): Map<NRL_ID_VALUE, AnalysisValidationSample[]> {
        const groups = new Map<NRL_ID_VALUE, AnalysisValidationSample[]>();
        samples.forEach(sample => {
            const group = groups.get(sample.nrl);
            if (group) {
                group.push(sample);
            } else {
                groups.set(sample.nrl, [sample]);
            }
        });
        return groups;
    }

    private findUnsupportedProcedures(
        nrl: NRL_ID_VALUE,
        group: AnalysisValidationSample[]
    ): AnalysisValidationFinding | null {
        const offered = this.offeredProcedures(nrl);
        const procedures = new Set<string>();
        const affected = new Set<number>();

        group.forEach(sample => {
            this.requestedProcedures(sample.analysis).forEach(procedure => {
                if (!offered.has(procedure)) {
                    procedures.add(procedure);
                    affected.add(sample.position);
                }
            });
        });

        if (procedures.size === 0) {
            return null;
        }

        const procedureList = [...procedures].sort();
        const sampleList = [...affected].sort((a, b) => a - b);
        return {
            issue: AnalysisValidationIssue.PROCEDURE_NOT_OFFERED_BY_NRL,
            nrl,
            samples: sampleList,
            procedures: procedureList,
            message:
                `The analysis ${this.pluralise(
                    procedureList.length,
                    'procedure'
                )} ${procedureList.join(', ')} ` +
                `${
                    procedureList.length === 1 ? 'is' : 'are'
                } not offered by ${nrl}. ` +
                `Affected ${this.pluralise(
                    sampleList.length,
                    'sample'
                )}: ${sampleList.join(', ')}.`
        };
    }

    private findInconsistentSelection(
        nrl: NRL_ID_VALUE,
        group: AnalysisValidationSample[]
    ): AnalysisValidationFinding | null {
        if (group.length < 2) {
            return null;
        }

        const reference = this.selectionFor(nrl, group[0].analysis);
        const deviating = group.filter(
            sample =>
                !_.isEqual(reference, this.selectionFor(nrl, sample.analysis))
        );

        if (deviating.length === 0) {
            return null;
        }

        // The reference sample is named too: it is the one whose selection
        // would silently have won, which is what the sender needs to know.
        const sampleList = [
            group[0].position,
            ...deviating.map(sample => sample.position)
        ].sort((a, b) => a - b);

        return {
            issue: AnalysisValidationIssue.DIFFERENT_ANALYSIS_FOR_SAME_NRL,
            nrl,
            samples: sampleList,
            procedures: [],
            message:
                `Different analysis procedures were requested for samples of the same NRL (${nrl}). ` +
                'This is not supported: all samples sent to one NRL must request the same analysis. ' +
                `Affected samples: ${sampleList.join(', ')}.`
        };
    }

    /**
     * The part of an analysis the sender actually controls for this NRL.
     *
     * Standard procedures are forced on for every sample regardless of what was
     * sent, so a difference there changes nothing and must not be reported.
     * Procedures the NRL does not offer are left out as well - they are covered
     * by the unsupported-procedure check and would otherwise be reported twice.
     */
    private selectionFor(
        nrl: NRL_ID_VALUE,
        analysis: Partial<Analysis>
    ): Record<string, unknown> {
        const optional = this.nrlService.getOptionalAnalysisFor(nrl);
        const selection: Record<string, unknown> = {};

        (Object.keys(optional) as (keyof Analysis)[]).forEach(procedure => {
            selection[procedure] = analysis[procedure] === true;
        });

        selection.other = (analysis.other ?? '').trim();
        selection.compareHuman = {
            active: this.isCompareHumanActive(analysis),
            value: (analysis.compareHuman?.value ?? '').trim()
        };

        return selection;
    }

    private offeredProcedures(nrl: NRL_ID_VALUE): Set<string> {
        return new Set([
            ...Object.keys(this.nrlService.getStandardAnalysisFor(nrl)),
            ...Object.keys(this.nrlService.getOptionalAnalysisFor(nrl)),
            ...ALWAYS_ALLOWED
        ]);
    }

    private requestedProcedures(analysis: Partial<Analysis>): string[] {
        return (Object.keys(analysis) as (keyof Analysis)[]).filter(
            procedure => {
                if (procedure === 'compareHuman') {
                    return this.isCompareHumanActive(analysis);
                }
                if (procedure === 'other') {
                    return !!(analysis.other ?? '').trim();
                }
                return analysis[procedure] === true;
            }
        );
    }

    private isCompareHumanActive(analysis: Partial<Analysis>): boolean {
        const compareHuman = analysis.compareHuman;
        return !!(compareHuman?.active || compareHuman?.value);
    }

    private pluralise(count: number, noun: string): string {
        return count === 1 ? noun : `${noun}s`;
    }
}

const analysisValidationService = new AnalysisValidationService(
    new NRLService(nrlCache)
);

export { analysisValidationService };
