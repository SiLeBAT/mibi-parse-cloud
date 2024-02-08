import { shallowEqual } from 'shallow-equal-object';

export interface ValueObjectProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [index: string]: any;
}

/**
 * @desc ValueObjects are objects that we determine their
 * equality through their structural property.
 */

export abstract class ValueObject<T extends ValueObjectProps> {
    readonly props: T;

    constructor(props: T) {
        this.props = Object.freeze(props);
    }

    equals(vo?: ValueObject<T>): boolean {
        if (vo === undefined) {
            return false;
        }
        if (vo.props === undefined) {
            return false;
        }
        return shallowEqual(this.props, vo.props);
    }

    abstract toString(): string;
}
