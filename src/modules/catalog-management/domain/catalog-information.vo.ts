import { date, object, string } from 'yup';
import {
    ValueObject,
    ValueObjectProps
} from '../../shared/domain/valueObjects';

interface CatalogInformationProps extends ValueObjectProps {
    validFrom: Date;
    catalogCode: string;
    version: string;
}

export class CatalogInformation extends ValueObject<CatalogInformationProps> {
    public toString(): string {
        return `${this.props.catalogCode} - ${this.props.version} -${this.props.validFrom}`;
    }

    private static catalogInformationSchema = object({
        validFrom: date().required('Catalog valid from date is required'),
        catalogCode: string().trim().required('Catalog code is required'),
        version: string().trim().required('Catalog version is required')
    });

    get catalogCode(): string {
        return this.props.catalogCode;
    }

    get version(): string {
        return this.props.version;
    }

    get validFrom(): Date {
        return this.props.validFrom;
    }

    private constructor(props: CatalogInformationProps) {
        super(props);
    }

    public static async create(
        props: CatalogInformationProps
    ): Promise<CatalogInformation> {
        const validatedProps =
            await CatalogInformation.catalogInformationSchema.validate(props);
        return new CatalogInformation(validatedProps);
    }
}
