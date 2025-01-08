import { object, string } from 'yup';
import { ValueObject, ValueObjectProps } from './value-object';

interface AVVCatalogProps extends ValueObjectProps {
    name: string;
    validFrom: string;
    version: string;
    data: string;
}

export class AVVCatalog extends ValueObject<AVVCatalogProps> {
    private static avvCatalogSchema = object({
        name: string().trim().required(),
        validFrom: string().trim().required(),
        version: string().trim().required(),
        data: string().trim().required()
    });

    public toString(): string {
        return `${this.name} ${this.version} ${this.validFrom}`;
    }

    get name(): string {
        return this.props.name;
    }

    get validFrom(): string {
        return this.props.validFrom;
    }

    get version(): string {
        return this.props.version;
    }

    get data(): string {
        return this.props.data;
    }

    private constructor(props: AVVCatalogProps) {
        super(props);
    }

    public static async create(props: AVVCatalogProps): Promise<AVVCatalog> {
        const validatedProps = await AVVCatalog.avvCatalogSchema.validate(
            props
        );
        return new AVVCatalog(validatedProps);
    }
}
