import { NRL_ID_VALUE } from '../../domain';
import { Analysis, NRL } from '..//model/legacy.model';
import { Sample } from '../model/sample.entity';
import { NRLRepository } from '../repositories/nrl.repository';
export class NRLService {
    static mapNRLStringToEnum(nrlString: string): NRL_ID_VALUE {
        switch (nrlString.trim()) {
            case 'Konsiliarlabor für Vibrionen':
            case 'KL-Vibrio':
                return NRL_ID_VALUE.KL_Vibrio;
            case 'NRL für Escherichia coli einschließl. verotoxinbildende E. coli':
            case 'NRL-VTEC':
                return NRL_ID_VALUE.NRL_VTEC;
            case 'Labor für Sporenbildner, Bacillus spp.':
            case 'L-Bacillus':
                return NRL_ID_VALUE.L_Bacillus;
            case 'Labor für Sporenbildner, Clostridium spp.':
            case 'L-Clostridium':
                return NRL_ID_VALUE.L_Clostridium;
            case 'NRL für koagulasepositive Staphylokokken einschl. Staphylococcus aureus':
            case 'NRL-Staph':
                return NRL_ID_VALUE.NRL_Staph;
            case 'NRL für Salmonella':
            case 'NRL-Salm':
                return NRL_ID_VALUE.NRL_Salm;
            case 'NRL für Listeria monocytogenes':
            case 'NRL-Listeria':
                return NRL_ID_VALUE.NRL_Listeria;
            case 'NRL für Campylobacter':
            case 'NRL-Campy':
                return NRL_ID_VALUE.NRL_Campy;
            case 'NRL für Antibiotikaresistenz':
            case 'NRL-AR':
                return NRL_ID_VALUE.NRL_AR;
            case 'Konsiliarlabor für Yersinia':
            case 'KL-Yersinia':
                return NRL_ID_VALUE.KL_Yersinia;
            case 'Labor nicht erkannt':
            default:
                return NRL_ID_VALUE.UNKNOWN;
        }
    }

    private nrlCache: NRL[] = [];
    constructor(private parseNrlRepository: NRLRepository) {
        this.parseNrlRepository
            .retrieve()
            .then(data => (this.nrlCache = data))
            .catch((error: Error) => {
                throw error;
            });
    }

    async retrieveNRLs(): Promise<NRL[]> {
        return this.parseNrlRepository.retrieve();
    }

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

        for (const nrlConfig of this.nrlCache) {
            for (const selector of nrlConfig.selectors) {
                const regexp = new RegExp(selector, 'i');
                if (regexp.test(pathogen)) {
                    return nrlConfig.id;
                }
            }
        }
        return NRL_ID_VALUE.UNKNOWN;
    }
    getOptionalAnalysisFor(nrl: NRL_ID_VALUE): Partial<Analysis> {
        const found = this.nrlCache.find(n => n.id === nrl);
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
        const found = this.nrlCache.find(n => n.id === nrl);
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

    getEmailForNRL(nrl: NRL_ID_VALUE): string {
        const found = this.nrlCache.find(n => n.id === nrl);
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
