import { object, string } from 'yup';
import { ValueObject, ValueObjectProps } from './value-object';

interface PLZProps extends ValueObjectProps {
    value: string;
}

export class PLZ extends ValueObject<PLZProps> {
    private static nameSchema = object({
        value: string().trim().required()
    });

    public toString(): string {
        return this.value;
    }

    get value(): string {
        return this.props.value;
    }

    private constructor(props: PLZProps) {
        super(props);
    }

    public static async create(props: PLZProps): Promise<PLZ> {
        const validatedProps = await PLZ.nameSchema.validate(props);
        return new PLZ(validatedProps);
    }
}
