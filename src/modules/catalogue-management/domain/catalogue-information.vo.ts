import { date, object, string } from 'yup';
import {
    ValueObject,
    ValueObjectProps
} from '../../shared/domain/valueObjects';

interface CatalogueInformationProps extends ValueObjectProps {
    validFrom: Date;
    catalogueCode: string;
    version: string;
}

export class CatalogueInformation extends ValueObject<CatalogueInformationProps> {
    public toString(): string {
        return `${this.props.catalogueCode} - ${this.props.version} -${this.props.validFrom}`;
    }

    private static catalogueInformationSchema = object({
        validFrom: date().required('Catalogue valid from date is required'),
        catalogueCode: string().trim().required('Catalogue code is required'),
        version: string().trim().required('Catalogue version is required')
    });

    get catalogueCode(): string {
        return this.props.catalogueCode;
    }

    get version(): string {
        return this.props.version;
    }

    get validFrom(): Date {
        return this.props.validFrom;
    }

    private constructor(props: CatalogueInformationProps) {
        super(props);
    }

    public static async create(
        props: CatalogueInformationProps
    ): Promise<CatalogueInformation> {
        const validatedProps =
            await CatalogueInformation.catalogueInformationSchema.validate(
                props
            );
        return new CatalogueInformation(validatedProps);
    }
}
