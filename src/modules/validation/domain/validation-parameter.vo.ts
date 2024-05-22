import { array, object, string } from 'yup';
import {
    ValueObject,
    ValueObjectProps
} from '../../shared/domain/valueObjects';
import { SampleEntry, SampleEntryTuple } from './sample-entry.entity';

interface ValidationOptions {
    state?: string;
    year?: string;
}
interface ValidationParameterProps extends ValueObjectProps {
    data: SampleEntry<SampleEntryTuple>[];
    options: ValidationOptions;
}

export class ValidationParameter extends ValueObject<ValidationParameterProps> {
    public toString(): string {
        return this.content;
    }

    private static validationParameterSchema = object({
        data: array().required('Sample data is required'),
        options: object({
            state: string()
        })
    });

    get content(): string {
        return this.props.content;
    }

    private constructor(props: ValidationParameterProps) {
        super(props);
    }

    public static async create(
        props: ValidationParameterProps
    ): Promise<ValidationParameter> {
        const validatedProps =
            await ValidationParameter.validationParameterSchema.validate(props);
        return new ValidationParameter(validatedProps);
    }
}
