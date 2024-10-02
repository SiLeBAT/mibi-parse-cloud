import { ValueObject, ValueObjectProps } from './value-object';

interface NRLIdProps extends ValueObjectProps {
    id: NRL_ID_VALUE;
}

export enum NRL_ID_VALUE {
    UNKNOWN = 'Labor nicht erkannt',
    KL_Vibrio = 'KL-Vibrio',
    NRL_VTEC = 'NRL-VTEC',
    L_Bacillus = 'L-Bacillus',
    NRL_AR = 'NRL-AR',
    NRL_Campy = 'NRL-Campy',
    NRL_Staph = 'NRL-Staph',
    NRL_Listeria = 'NRL-Listeria',
    NRL_Salm = 'NRL-Salm',
    L_Clostridium = 'L-Clostridium',
    KL_Yersinia = 'KL-Yersinia'
}

export class NRLId extends ValueObject<NRLIdProps> {
    toString(): string {
        return this.props.id.toString();
    }

    private constructor(props: NRLIdProps) {
        super(props);
    }

    static create(idAsString: string) {
        const id = this.mapNRLStringToEnum(idAsString);
        const nrlId = new NRLId({ id });
        return nrlId;
    }
    public static mapNRLStringToEnum(nrlString: string): NRL_ID_VALUE {
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

    get value(): NRL_ID_VALUE {
        return this.props.id;
    }
}
