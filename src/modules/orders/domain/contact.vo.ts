import {
    Email,
    ValueObject,
    ValueObjectProps
} from '../../shared/domain/valueObjects';

interface ContactProps extends ValueObjectProps {
    instituteName: string;
    department?: string;
    street: string;
    zip: string;
    city: string;
    contactPerson: string;
    telephone: string;
    email: Email;
}

export class Contact extends ValueObject<ContactProps> {
    toString(): string {
        return `${this.props.contactPerson}`;
    }

    private constructor(props: ContactProps) {
        super(props);
    }

    static create(props: ContactProps) {
        const contact = new Contact(props);
        return contact;
    }

    get instituteName(): string {
        return this.props.instituteName;
    }
    get department(): string {
        return this.props.department || '';
    }
    get street(): string {
        return this.props.street;
    }
    get zip(): string {
        return this.props.zip;
    }
    get city(): string {
        return this.props.city;
    }
    get contactPerson(): string {
        return this.props.contactPerson;
    }
    get telephone(): string {
        return this.props.telephone;
    }
    get email(): Email {
        return this.props.email;
    }
}
