import { Entity } from '../../shared/domain/entities';
import { EntityId } from '../../shared/domain/valueObjects';

import { FileContent } from './file-content.vo';

export interface CreateFromFileContentProps {
    fileContent: FileContent;
}

export interface CatalogueProps<T> {
    catalogueNumber: string;
    validFrom: Date | null;
    version: string;
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

    get catalogueNumber(): string {
        return this.props.catalogueNumber;
    }

    get version(): string {
        return this.props.version;
    }

    get validFrom(): Date | null {
        return this.props.validFrom;
    }

    set validFrom(date: Date | null) {
        this.props.validFrom = date;
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
