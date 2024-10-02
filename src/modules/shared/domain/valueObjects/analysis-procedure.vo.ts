import { number, object, string } from 'yup';
import { ValueObject, ValueObjectProps } from './value-object';

interface AnalysisProcedureProps extends ValueObjectProps {
    value: string;
    key: number;
}

export class AnalysisProcedure extends ValueObject<AnalysisProcedureProps> {
    private static analysisProcedureSchema = object({
        value: string().trim().required(),
        key: number().required()
    });

    public toString(): string {
        return this.value;
    }

    get value(): string {
        return this.props.value;
    }

    get key(): number {
        return this.props.key;
    }

    private constructor(props: AnalysisProcedureProps) {
        super(props);
    }

    public static async create(
        props: AnalysisProcedureProps
    ): Promise<AnalysisProcedure> {
        const validatedProps =
            await AnalysisProcedure.analysisProcedureSchema.validate(props);
        return new AnalysisProcedure(validatedProps);
    }
}
