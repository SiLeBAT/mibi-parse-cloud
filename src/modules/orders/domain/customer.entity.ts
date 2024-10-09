import { Entity } from '../../shared/domain/entities';
import { EntityId, Name } from '../../shared/domain/valueObjects';
import { Contact } from './contact.vo';
import { Bundesland } from './enums';

export interface CustomerProps {
    contact: Contact;
    firstName?: Name;
    lastName?: Name;
    customerRefNumber: string;
}

export class Customer extends Entity<CustomerProps> {
    static create(props: CustomerProps, id?: EntityId): Customer {
        const userInformation = new Customer(props, id);
        return userInformation;
    }

    private constructor(props: CustomerProps, id?: EntityId) {
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

    get customerRefNumber(): string {
        return this.props.customerRefNumber;
    }

    get fullName(): string {
        return this.firstName + ' ' + this.lastName;
    }

    getStateAbbreviation(): Bundesland {
        return this.contact.stateShort;
    }
}
