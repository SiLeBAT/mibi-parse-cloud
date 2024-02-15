import {
    ValueObject,
    ValueObjectProps
} from '../../shared/domain/valueObjects/value-object';

interface ContactProps extends ValueObjectProps {
    instituteName: string;
    department?: string;
    street: string;
    zip: string;
    city: string;
    contactPerson: string;
    telephone: string;
    email: string;
}

export class Contact extends ValueObject<ContactProps> {
    // TODO: Write proper string
    toString(): string {
        return `${this.props.instituteName}`;
    }

    private constructor(props: ContactProps) {
        super(props);
    }

    static create(props: ContactProps) {
        const contact = new Contact(props);
        return contact;
    }
}
