import {
    ValueObject,
    ValueObjectProps
} from '../../shared/domain/valueObjects';
import { Email } from './email.vo';
import { SemanticVersion } from './semantic-version.vo';

interface SystemInformationProps extends ValueObjectProps {
    version: SemanticVersion;
    lastChange: Date;
    supportContact: Email | null;
}

export class SystemInformation extends ValueObject<SystemInformationProps> {
    public toString(): string {
        return JSON.stringify({
            version: this.semanticVersion.toString(),
            lastChange: this.dateOfLastChange.toString(),
            supportContact: this.supportContact
                ? this.supportContact.toString()
                : ''
        });
    }

    get dateOfLastChange(): Date {
        return this.props.lastChange;
    }

    get semanticVersion(): SemanticVersion {
        return this.props.version;
    }

    get supportContact(): Email | null {
        return this.props.supportContact;
    }
    private constructor(props: SystemInformationProps) {
        super(props);
    }

    public static create(props: SystemInformationProps): SystemInformation {
        return new SystemInformation(props);
    }
}
