import { object, string, array } from 'yup';
import { ValueObject, ValueObjectProps } from './value-object';

interface SearchAliasProps extends ValueObjectProps {
    catalog: string;
    token: string;
    alias: string[];
}

export class SearchAlias extends ValueObject<SearchAliasProps> {
    private static searchAliasSchema = object({
        catalog: string().trim().required(),
        token: string().trim().required(),
        alias: array().required()
    });

    public toString(): string {
        return `${this.token} ${this.alias}`;
    }

    get catalog(): string {
        return this.props.catalog;
    }

    get token(): string {
        return this.props.token;
    }

    get alias(): string[] {
        return this.props.alias;
    }

    private constructor(props: SearchAliasProps) {
        super(props);
    }

    public static async create(props: SearchAliasProps): Promise<SearchAlias> {
        const validatedProps = await SearchAlias.searchAliasSchema.validate(
            props
        );
        return new SearchAlias(validatedProps);
    }
}
