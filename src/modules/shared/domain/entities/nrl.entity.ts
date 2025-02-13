import { Entity } from '.';
import {
    AnalysisProcedure,
    Email,
    EntityId,
    NRL_ID_VALUE
} from '../valueObjects';

export interface NRLProps {
    selectors: string[];
    nrlId: NRL_ID_VALUE;
    email: Email;
    standardProcedures: AnalysisProcedure[];
    optionalProcedures: AnalysisProcedure[];
}

export class NRL extends Entity<NRLProps> {
    static create(props: NRLProps, id?: EntityId): NRL {
        const userInformation = new NRL(props, id);
        return userInformation;
    }

    private constructor(props: NRLProps, id?: EntityId) {
        super(props, id);
    }

    get selectors(): string[] {
        return this.props.selectors;
    }

    get nrlId(): NRL_ID_VALUE {
        return this.props.nrlId;
    }
    get email(): Email {
        return this.props.email;
    }
    get standardProcedures(): AnalysisProcedure[] {
        return this.props.standardProcedures;
    }
    get optionalProcedures(): AnalysisProcedure[] {
        return this.props.optionalProcedures;
    }
}
