import { object, string } from 'yup';
import { ValueObject, ValueObjectProps } from './value-object';

interface AVVCatalogueProps extends ValueObjectProps {
    name: string;
    validFrom: string;
    version: string;
    data: string;
}

export class AVVCatalogue extends ValueObject<AVVCatalogueProps> {
    private static avvCatalogueSchema = object({
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

    private constructor(props: AVVCatalogueProps) {
        super(props);
    }

    public static async create(
        props: AVVCatalogueProps
    ): Promise<AVVCatalogue> {
        const validatedProps = await AVVCatalogue.avvCatalogueSchema.validate(
            props
        );
        return new AVVCatalogue(validatedProps);
    }
}
