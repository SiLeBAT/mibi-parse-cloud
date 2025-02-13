import { object, string, ValidationError } from 'yup';
import { ValueObject, ValueObjectProps } from './value-object';
import { EmailValidationError } from './email-validation.error';

interface EmailProps extends ValueObjectProps {
    value: string;
}

export class Email extends ValueObject<EmailProps> {
    private static emailSchema = object({
        value: string().trim().required().email()
    });

    public toString(): string {
        return this.value;
    }

    get value(): string {
        return this.props.value;
    }

    private constructor(props: EmailProps) {
        super(props);
    }

    public static async create(props: EmailProps): Promise<Email> {
        try {
            const validatedProps = await Email.emailSchema.validate(props);
            return new Email(validatedProps);
        } catch (error) {
            if (error instanceof ValidationError) {
                throw new EmailValidationError(
                    'Email Validation failed',
                    new Error('Email Validation failed')
                );
            }

            throw error;
        }
    }
}
