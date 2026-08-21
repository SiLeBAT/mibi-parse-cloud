import {
    Email,
    ValueObject,
    ValueObjectProps
} from '../../shared/domain/valueObjects';
import { SemanticVersion } from './semantic-version.vo';

interface SystemInformationProps extends ValueObjectProps {
    version: SemanticVersion;
    lastChange: Date;
    supportContact: Email | null;
    // The channel to fall back on when mail is the thing that is broken, so it
    // is served alongside the support address rather than hard-coded in the
    // client.
    supportPhone: string | null;
}

export class SystemInformation extends ValueObject<SystemInformationProps> {
    public toString(): string {
        return JSON.stringify({
            version: this.semanticVersion.toString(),
            lastChange: this.dateOfLastChange.toString(),
            supportContact: this.supportContact
                ? this.supportContact.toString()
                : '',
            supportPhone: this.supportPhone || ''
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

    get supportPhone(): string | null {
        return this.props.supportPhone;
    }
    private constructor(props: SystemInformationProps) {
        super(props);
    }

    public static create(props: SystemInformationProps): SystemInformation {
        return new SystemInformation(props);
    }
}
