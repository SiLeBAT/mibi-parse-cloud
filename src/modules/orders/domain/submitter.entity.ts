import { Entity } from '../../shared/domain/entities';
import { EntityId, Name } from '../../shared/domain/valueObjects';
import { Contact } from './contact.vo';
import { Bundesland } from './enums';

export interface SubmitterProps {
    contact: Contact;
    firstName?: Name;
    lastName?: Name;
    submitterId: EntityId;
}

export class Submitter extends Entity<SubmitterProps> {
    static create(props: SubmitterProps, id?: EntityId): Submitter {
        const userInformation = new Submitter(props, id);
        return userInformation;
    }

    private constructor(props: SubmitterProps, id?: EntityId) {
        super(props, id);
    }

    get contact(): Contact {
        return this.props.contact;
    }

    get lastName(): Name | undefined {
        return this.props.lastName;
    }

    get firstName(): Name | undefined {
        return this.props.firstName;
    }

    get submitterId(): EntityId {
        return this.props.submitterId;
    }

    get fullName(): string {
        return this.firstName + ' ' + this.lastName;
    }

    getStateAbbreviation(): Bundesland {
        return this.contact.stateShort;
    }
}
