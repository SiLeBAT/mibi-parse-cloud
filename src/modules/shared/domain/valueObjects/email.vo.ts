import { object, string, ValidationError } from 'yup';
import { EmailValidationError } from './email-validation.error';
import { ValueObject, ValueObjectProps } from './value-object';

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
        const validatedProps = await Email.emailSchema.validate(props);
        try {
            return new Email(validatedProps);
        } catch (error) {
            if (error instanceof ValidationError) {
                const errorMessage = `Email Validation failed: ${validatedProps.value} is not a valid email address`;
                throw new EmailValidationError(
                    errorMessage,
                    new Error(errorMessage)
                );
            }

            throw error;
        }
    }
}
