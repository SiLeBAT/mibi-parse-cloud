import { Entity } from '../../shared/domain/entities';
import { EntityId } from '../../shared/domain/valueObjects';
import { CatalogInformation } from './catalog-information.vo';

export interface CatalogProps<T> {
    catalogInformation: CatalogInformation;
    data: T;
    uId: string;
}
export class Catalog<T> extends Entity<CatalogProps<T>> {
    static create<T>(props: CatalogProps<T>, id?: EntityId) {
        return new Catalog(props, id);
    }

    constructor(props: CatalogProps<T>, id?: EntityId) {
        super(props, id);
    }

    get catalogInformation(): CatalogInformation {
        return this.props.catalogInformation;
    }

    get JSON(): string {
        return JSON.stringify(
            {
                data: this.props.data,
                uId: this.props.uId
            },
            null,
            2
        );
    }
}
