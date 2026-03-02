import { string, object } from 'yup';
import {
    ValueObject,
    ValueObjectProps
} from '../../shared/domain/valueObjects';

interface ZomoPlanFileInformationProps extends ValueObjectProps {
    year: string;
}

export class ZomoPlanFileInformation extends ValueObject<ZomoPlanFileInformationProps> {
    public toString(): string {
        return `${this.props.year}`;
    }

    private static zomoPlanFileInformationSchema = object({
        year: string().required('Zomo Plan File year is required')
    });

    get year(): string {
        return this.props.year;
    }

    private constructor(props: ZomoPlanFileInformationProps) {
        super(props);
    }

    public static async create(
        props: ZomoPlanFileInformationProps
    ): Promise<ZomoPlanFileInformation> {
        const validatedProps =
            await ZomoPlanFileInformation.zomoPlanFileInformationSchema.validate(
                props
            );
        return new ZomoPlanFileInformation(validatedProps);
    }
}
