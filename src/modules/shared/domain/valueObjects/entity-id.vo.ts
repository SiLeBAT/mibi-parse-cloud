import { ValueObject, ValueObjectProps } from './value-object';

interface EntityIdProps extends ValueObjectProps {
    value: string;
}

export class EntityId extends ValueObject<EntityIdProps> {
    get value(): string {
        return this.props.value;
    }

    private constructor(props: EntityIdProps) {
        super(props);
    }

    public toString() {
        return this.props.value;
    }

    public static create(props: EntityIdProps): EntityId {
        const entityId = new EntityId(props);
        return entityId;
    }
}
