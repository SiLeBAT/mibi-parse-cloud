import {
    ValueObject,
    ValueObjectProps
} from '../../shared/domain/valueObjects';

export interface InstituteProps extends ValueObjectProps {
    state_short: string;
}

export class Institute extends ValueObject<InstituteProps> {
    toString(): string {
        return this.props.id.toString();
    }

    private constructor(props: InstituteProps) {
        super(props);
    }

    static create(props: InstituteProps) {
        const institute = new Institute(props);
        return institute;
    }

    get stateShort(): string {
        return this.props.state_short;
    }
}
