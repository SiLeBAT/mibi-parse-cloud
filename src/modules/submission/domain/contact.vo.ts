import {
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
    email: string;
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
}
