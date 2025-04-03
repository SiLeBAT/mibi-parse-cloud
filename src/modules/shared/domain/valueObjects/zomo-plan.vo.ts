import { object, string } from 'yup';
import { ValueObject, ValueObjectProps } from './value-object';

interface ZomoPlanProps extends ValueObjectProps {
    year: string;
    data: string;
}

export class ZomoPlan extends ValueObject<ZomoPlanProps> {
    private static zomoPlanSchema = object({
        year: string().trim().required(),
        data: string().trim().required()
    });

    public toString(): string {
        return `${this.year}`;
    }

    get year(): string {
        return this.props.year;
    }

    get data(): string {
        return this.props.data;
    }

    private constructor(props: ZomoPlanProps) {
        super(props);
    }

    public static async create(props: ZomoPlanProps): Promise<ZomoPlan> {
        const validatedProps = await ZomoPlan.zomoPlanSchema.validate(props);
        return new ZomoPlan(validatedProps);
    }
}
