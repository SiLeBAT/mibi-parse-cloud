import { Entity } from '../../shared/domain/entities';
import { EntityId } from '../../shared/domain/valueObjects';
import { CatalogueInformation } from './catalogue-information.vo';

export interface CatalogueProps<T> {
    catalogueInformation: CatalogueInformation;
    data: T;
    uId: string;
}
export class Catalogue<T> extends Entity<CatalogueProps<T>> {
    static create<T>(props: CatalogueProps<T>, id?: EntityId) {
        return new Catalogue(props, id);
    }

    constructor(props: CatalogueProps<T>, id?: EntityId) {
        super(props, id);
    }

    get catalogueInformation(): CatalogueInformation {
        return this.props.catalogueInformation;
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
