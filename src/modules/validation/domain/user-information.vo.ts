import {
    ValueObject,
    ValueObjectProps
} from '../../shared/domain/valueObjects';
import { Institute } from './institute.vo';

export interface UserInformationProps extends ValueObjectProps {
    institute: Institute;
}

export class UserInformation extends ValueObject<UserInformationProps> {
    toString(): string {
        return this.props.id.toString();
    }

    private constructor(props: UserInformationProps) {
        super(props);
    }

    static create(props: UserInformationProps) {
        const userInformation = new UserInformation(props);
        return userInformation;
    }

    get institute(): Institute {
        return this.props.institute;
    }
}
