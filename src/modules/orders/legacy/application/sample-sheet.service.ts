import _ from 'lodash';

import { NRL_ID_VALUE } from '../../../shared/domain/valueObjects';
import {
    Analysis,
    EMPTY_ANALYSIS,
    SampleSet,
    SampleSheet,
    SampleSheetAnalysis,
    SampleSheetAnalysisOption,
    SampleSheetMetaData,
    UnmarshalSampleSheet,
    UnmarshalSampleSet,
    UnmarshalSample,
    Urgency
} from '../model/legacy.model';
import { Sample } from '../model/sample.entity';
import { NRLService } from './nrl.service';

export class SampleSheetService {
    private readonly MAX_CHARACTERS = 120;

    constructor(private nrlService: NRLService) {}

    async fromSampleSetToSampleSheet(
        sampleSet: SampleSet
    ): Promise<SampleSheet> {
        return {
            samples: sampleSet.samples,
            meta: await this.getSampleSheetMetaFromSampleSet(sampleSet)
        };
    }

    fromSampleSheetToSampleSet(
        sampleSheet: UnmarshalSampleSheet
    ): UnmarshalSampleSet {
        // MPCL-832: the sheet's analysis section is applied whatever NRLs the
        // samples belong to. It used to be applied only when the whole sheet
        // resolved to one NRL, which silently discarded the sender's selection
        // for sheets covering several NRLs and left the NRL defaults in place.
        // Procedures an NRL does not offer are reported by the
        // AnalysisValidationService on submission rather than dropped here.
        this.addMetaDataToSamples(sampleSheet);

        return {
            samples: sampleSheet.samples,
            meta: {
                sender: sampleSheet.meta.sender,
                fileName: sampleSheet.meta.fileName,
                customerRefNumber: sampleSheet.meta.customerRefNumber,
                signatureDate: sampleSheet.meta.signatureDate,
                version: sampleSheet.meta.version
            }
        };
    }

    private async getSampleSheetMetaFromSampleSet(
        sampleSet: SampleSet
    ): Promise<SampleSheetMetaData> {
        const nrl = this.tryGetSingleNRL(sampleSet.samples);
        let urgency = Urgency.NORMAL;

        // MPCL-832: an order covering several NRLs has no single procedure
        // catalogue to render the section from, so it is merged from all
        // samples instead of being exported empty.
        const analysis =
            nrl === NRL_ID_VALUE.UNKNOWN
                ? this.mergeSampleSheetAnalysis(
                      sampleSet.samples.map(s => s.getAnalysis())
                  )
                : await this.calcSampleSheetAnalysis(
                      nrl,
                      sampleSet.samples.map(s => s.getAnalysis())
                  );

        if (nrl !== NRL_ID_VALUE.UNKNOWN) {
            urgency = this.calcSampleSheetUrgency(
                sampleSet.samples.map(s => s.getUrgency())
            );
        }

        return {
            nrl,
            analysis,
            sender: sampleSet.meta.sender,
            urgency,
            fileName: sampleSet.meta.fileName,
            customerRefNumber: sampleSet.meta.customerRefNumber,
            signatureDate: sampleSet.meta.signatureDate,
            version: sampleSet.meta.version
        };
    }

    // A sample sheet has one analysis section for the whole NRL, while the
    // analysis is held per sample, so the first sample's is used for the sheet.
    // Submissions where the samples of one NRL disagree are rejected before
    // they get here (AnalysisValidationService), so nothing is lost silently.
    private async calcSampleSheetAnalysis(
        nrl: NRL_ID_VALUE,
        partialAnalysis: Partial<Analysis>[]
    ): Promise<SampleSheetAnalysis> {
        const firstAnalysis = partialAnalysis[0];

        // an analysis is valid if it is not undefined
        // other and comparehuman are always undefined (so always optional?)
        const standardAnalysis = await this.nrlService.getStandardAnalysisFor(
            nrl
        );
        const optionalAnalysis = await this.nrlService.getOptionalAnalysisFor(
            nrl
        );

        const getOptionFor = (
            key: keyof Analysis
        ): SampleSheetAnalysisOption => {
            if (standardAnalysis[key] !== undefined) {
                return SampleSheetAnalysisOption.STANDARD;
            }
            if (optionalAnalysis[key] === undefined) {
                return SampleSheetAnalysisOption.OMIT;
            }

            // analysis is optional
            return firstAnalysis[key] === true
                ? SampleSheetAnalysisOption.ACTIVE
                : SampleSheetAnalysisOption.OMIT;
        };

        const isCompareHumanActive = firstAnalysis['compareHuman']
            ? firstAnalysis['compareHuman'].active ||
              !!firstAnalysis['compareHuman'].value
            : false;
        const compareHumanText = firstAnalysis['compareHuman']
            ? firstAnalysis['compareHuman'].value
            : '';

        const otherText = firstAnalysis['other'] || '';

        return {
            species: getOptionFor('species'),
            serological: getOptionFor('serological'),
            resistance: getOptionFor('resistance'),
            vaccination: getOptionFor('vaccination'),
            molecularTyping: getOptionFor('molecularTyping'),
            toxin: getOptionFor('toxin'),
            esblAmpCCarbapenemasen: getOptionFor('esblAmpCCarbapenemasen'),
            other: otherText
                ? SampleSheetAnalysisOption.ACTIVE
                : SampleSheetAnalysisOption.OMIT,
            otherText: otherText,
            compareHuman: isCompareHumanActive
                ? SampleSheetAnalysisOption.ACTIVE
                : SampleSheetAnalysisOption.OMIT,
            compareHumanText: compareHumanText
        };
    }

    // MPCL-832: the analysis section of an order whose samples belong to
    // several NRLs. There is no single catalogue of procedures then, so
    // standard and optional cannot be told apart and everything requested by
    // at least one sample is marked as actively selected - which is what the
    // sheet parser reads back when the exported file is uploaded again.
    private mergeSampleSheetAnalysis(
        partialAnalysis: Partial<Analysis>[]
    ): SampleSheetAnalysis {
        const getOptionFor = (key: keyof Analysis): SampleSheetAnalysisOption =>
            partialAnalysis.some(analysis => analysis[key] === true)
                ? SampleSheetAnalysisOption.ACTIVE
                : SampleSheetAnalysisOption.OMIT;

        // The free texts are single fields on the sheet, so the first one
        // filled in wins.
        const otherText =
            partialAnalysis
                .map(analysis => analysis.other || '')
                .find(text => text !== '') || '';
        const compareHumanText =
            partialAnalysis
                .map(analysis => analysis.compareHuman?.value || '')
                .find(text => text !== '') || '';
        const isCompareHumanActive =
            !!compareHumanText ||
            partialAnalysis.some(
                analysis => analysis.compareHuman?.active === true
            );

        return {
            species: getOptionFor('species'),
            serological: getOptionFor('serological'),
            resistance: getOptionFor('resistance'),
            vaccination: getOptionFor('vaccination'),
            molecularTyping: getOptionFor('molecularTyping'),
            toxin: getOptionFor('toxin'),
            esblAmpCCarbapenemasen: getOptionFor('esblAmpCCarbapenemasen'),
            other: otherText
                ? SampleSheetAnalysisOption.ACTIVE
                : SampleSheetAnalysisOption.OMIT,
            otherText: otherText,
            compareHuman: isCompareHumanActive
                ? SampleSheetAnalysisOption.ACTIVE
                : SampleSheetAnalysisOption.OMIT,
            compareHumanText: compareHumanText
        };
    }

    // sample specific meta data not implemented yet,
    // so use the first samples urgency
    private calcSampleSheetUrgency(urgencies: Urgency[]): Urgency {
        return urgencies[0];
    }

    private tryGetSingleNRL(
        samples: UnmarshalSample[] | Sample[]
    ): NRL_ID_VALUE {
        const nrls = _.uniq(samples.map(s => s.getNRL()));
        return nrls.length === 1 ? nrls[0] : NRL_ID_VALUE.UNKNOWN;
    }

    private addMetaDataToSamples(sampleSheet: UnmarshalSampleSheet) {
        sampleSheet.samples.forEach(sample => {
            sample.setAnalysis(
                this.nrlService,
                this.fromSampleSheetAnalysisToSampleAnalysis(
                    sampleSheet.meta.analysis
                )
            );
            sample.setUrgency(sampleSheet.meta.urgency);
        });
    }

    private fromSampleSheetAnalysisToSampleAnalysis(
        analysis: SampleSheetAnalysis
    ): Analysis {
        return {
            ...EMPTY_ANALYSIS,
            ...{
                species: analysis.species !== SampleSheetAnalysisOption.OMIT,
                serological:
                    analysis.serological !== SampleSheetAnalysisOption.OMIT,
                resistance:
                    analysis.resistance !== SampleSheetAnalysisOption.OMIT,
                vaccination:
                    analysis.vaccination !== SampleSheetAnalysisOption.OMIT,
                molecularTyping:
                    analysis.molecularTyping !== SampleSheetAnalysisOption.OMIT,
                toxin: analysis.toxin !== SampleSheetAnalysisOption.OMIT,
                esblAmpCCarbapenemasen:
                    analysis.esblAmpCCarbapenemasen !==
                    SampleSheetAnalysisOption.OMIT,
                other:
                    analysis.otherText.length > this.MAX_CHARACTERS
                        ? analysis.otherText.slice(0, this.MAX_CHARACTERS)
                        : analysis.otherText,
                compareHuman: {
                    active:
                        analysis.compareHuman !==
                            SampleSheetAnalysisOption.OMIT ||
                        analysis.compareHumanText !== '',
                    value:
                        analysis.compareHumanText.length > this.MAX_CHARACTERS
                            ? analysis.compareHumanText.slice(
                                  0,
                                  this.MAX_CHARACTERS
                              )
                            : analysis.compareHumanText
                }
            }
        };
    }
}
