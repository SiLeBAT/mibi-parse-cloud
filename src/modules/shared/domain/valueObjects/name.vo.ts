import { object, string } from 'yup';
import { ValueObject, ValueObjectProps } from './value-object';

interface NameProps extends ValueObjectProps {
    value: string;
}

export class Name extends ValueObject<NameProps> {
    private static nameSchema = object({
        value: string()
            .trim()
            .required()
            .max(30, 'Must be 30 characters or less')
    });

    public toString(): string {
        return this.value;
    }

    get value(): string {
        return this.props.value;
    }

    private constructor(props: NameProps) {
        super(props);
    }

    public static async create(props: NameProps): Promise<Name> {
        const validatedProps = await Name.nameSchema.validate(props);
        return new Name(validatedProps);
    }
}
