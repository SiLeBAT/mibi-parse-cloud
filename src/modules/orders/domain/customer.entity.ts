import { Entity } from '../../shared/domain/entities';
import { EntityId } from '../../shared/domain/valueObjects';
import { Contact } from './contact.vo';

export interface CustomerProps {
    contact: Contact;
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

    get customerRefNumber(): string {
        return this.props.customerRefNumber;
    }
}
