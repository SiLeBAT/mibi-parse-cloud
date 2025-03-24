import { string, object } from 'yup';
import {
    ValueObject,
    ValueObjectProps
} from '../../shared/domain/valueObjects';

interface ZomoPlanInformationProps extends ValueObjectProps {
    year: string;
}

export class ZomoPlanInformation extends ValueObject<ZomoPlanInformationProps> {
    public toString(): string {
        return `${this.props.year}`;
    }

    private static zomoPlanInformationSchema = object({
        year: string().required('Zomo Plan year is required')
    });

    get year(): string {
        return this.props.year;
    }

    private constructor(props: ZomoPlanInformationProps) {
        super(props);
    }

    public static async create(
        props: ZomoPlanInformationProps
    ): Promise<ZomoPlanInformation> {
        const validatedProps =
            await ZomoPlanInformation.zomoPlanInformationSchema.validate(props);
        return new ZomoPlanInformation(validatedProps);
    }
}
