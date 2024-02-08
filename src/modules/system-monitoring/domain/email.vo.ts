import { object, string } from 'yup';
import {
    ValueObject,
    ValueObjectProps
} from '../../shared/domain/valueObjects';

interface EmailProps extends ValueObjectProps {
    value: string;
}

export class Email extends ValueObject<EmailProps> {
    public toString(): string {
        return this.value;
    }

    private static emailSchema = object({
        value: string()
            .trim()
            .email('Invalid email address')
            .required('An email is required')
    });

    get value(): string {
        return this.props.value;
    }

    private constructor(props: EmailProps) {
        super(props);
    }

    public static async create(props: EmailProps): Promise<Email> {
        const validatedProps = await Email.emailSchema.validate(props);
        return new Email(validatedProps);
    }
}
