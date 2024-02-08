import { object, string } from 'yup';
import {
    ValueObject,
    ValueObjectProps
} from '../../shared/domain/valueObjects';

interface SemanticVersionProps extends ValueObjectProps {
    value: string;
}

export class SemanticVersion extends ValueObject<SemanticVersionProps> {
    public toString(): string {
        return this.value;
    }

    // RegEx is found in SemVer 2.0 Documentation
    private static semanticVersionSchema = object({
        value: string()
            .trim()
            .matches(
                /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
            )
            .required('An version number is required')
    });

    get value(): string {
        return this.props.value;
    }

    private constructor(props: SemanticVersionProps) {
        super(props);
    }

    public static async create(
        props: SemanticVersionProps
    ): Promise<SemanticVersion> {
        const validatedProps =
            await SemanticVersion.semanticVersionSchema.validate(props);
        return new SemanticVersion(validatedProps);
    }
}
