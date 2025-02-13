import { v4 as uuid } from 'uuid';
import { EntityId } from '../valueObjects/entity-id.vo';

export abstract class Entity<T> {
    protected readonly _id: EntityId;

    protected props: T;

    constructor(props: T, id?: EntityId) {
        this._id = id ? id : EntityId.create({ value: uuid() });
        this.props = props;
    }

    get id(): EntityId {
        return this._id;
    }

    equals(object?: Entity<T>): boolean {
        if (object === undefined) {
            return false;
        }

        if (this === object) {
            return true;
        }

        if (!this.isEntity(object)) {
            return false;
        }

        return this._id.equals(object._id);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private isEntity(v: any): v is Entity<any> {
        return v instanceof Entity;
    }
}
