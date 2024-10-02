import { Email, NRL_ID_VALUE } from '../../../shared/domain/valueObjects';
import { NRLCache } from '../../../shared/infrastructure';
import { Analysis } from '..//model/legacy.model';
import { Sample } from '../model/sample.entity';
export class NRLService {
    constructor(private nrlCache: NRLCache) {}

    assignNRLsToSamples(samples: Sample[]): Sample[] {
        return samples.map(sample => {
            const newSample = sample.clone();
            const pathogen = newSample.getValueFor('pathogen_avv');
            const nrl = this.getNRLForPathogen(pathogen);

            newSample.setNRL(this, nrl);
            return newSample;
        });
    }

    getNRLForPathogen(pathogen: string): NRL_ID_VALUE {
        if (!pathogen) {
            return NRL_ID_VALUE.UNKNOWN;
        }

        for (const nrlConfig of this.nrlCache.getNRLList()) {
            for (const selector of nrlConfig.selectors) {
                const regexp = new RegExp(selector, 'i');
                if (regexp.test(pathogen)) {
                    return nrlConfig.nrlId;
                }
            }
        }
        return NRL_ID_VALUE.UNKNOWN;
    }
    getOptionalAnalysisFor(nrl: NRL_ID_VALUE): Partial<Analysis> {
        const found = this.nrlCache.getNRLById(nrl);
        if (!found) {
            return {};
        }
        const analysis: Partial<Analysis> = {};

        found.optionalProcedures.reduce((acc, p) => {
            this.setValueForAnalysisKey(p.key, acc, false);
            return acc;
        }, analysis);

        return analysis;
    }

    getStandardAnalysisFor(nrl: NRL_ID_VALUE): Partial<Analysis> {
        const found = this.nrlCache.getNRLById(nrl);

        if (!found) {
            return {};
        }

        const analysis: Partial<Analysis> = {};
        found.standardProcedures.reduce((acc, p) => {
            this.setValueForAnalysisKey(p.key, acc, true);
            return acc;
        }, analysis);

        return analysis;
    }

    getEmailForNRL(nrl: NRL_ID_VALUE): Email {
        const found = this.nrlCache.getNRLById(nrl);
        if (!found) {
            throw new Error(
                `Unable to retrieve email for NRL. nrl=${nrl.toString()}`
            );
        }
        return found.email;
    }
    private setValueForAnalysisKey(
        key: number,
        analysis: Partial<Analysis>,
        value: boolean
    ): void {
        switch (key) {
            case 0:
                analysis.species = value;
                break;
            case 1:
                analysis.serological = value;
                break;
            case 2:
                analysis.resistance = value;
                break;
            case 3:
                analysis.vaccination = value;
                break;
            case 4:
                analysis.molecularTyping = value;
                break;
            case 5:
                analysis.toxin = value;
                break;
            case 6:
                analysis.esblAmpCCarbapenemasen = value;
                break;
            case 7:
                analysis.sample = value;
                break;
        }
    }
}
