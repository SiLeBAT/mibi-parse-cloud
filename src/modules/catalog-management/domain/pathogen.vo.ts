import { object, string } from 'yup';
import {
    ValueObject,
    ValueObjectProps
} from '../../shared/domain/valueObjects';

interface PathogenProps extends ValueObjectProps {
    pathogen: string;
}

export class Pathogen extends ValueObject<PathogenProps> {
    public toString(): string {
        return `${this.props.pathogen}`;
    }

    private static pathogenSchema = object({
        pathogen: string().trim().required('Pathogen is required')
    });

    get pathogen(): string {
        return this.props.pathogen;
    }

    private constructor(props: PathogenProps) {
        super(props);
    }

    public static async create(props: PathogenProps): Promise<Pathogen> {
        const validatedProps = await Pathogen.pathogenSchema.validate(props);
        return new Pathogen(validatedProps);
    }
}
