import { AggregateRoot } from '../../domain/entities';
import { EntityId } from '../../domain/valueObjects';

export abstract class AbstractRepository<
    IProps,
    IAttributes extends Parse.Attributes,
    V extends Parse.Object<IAttributes>,
    R extends AggregateRoot<IProps>
> {
    public abstract save(aggregate: R, user: Parse.User): Promise<EntityId>;

    protected abstract getOwnObjectByEId(eId: EntityId): Promise<V>;

    async delete(aggregateRoot: R) {
        const object = await this.getOwnObjectByEId(aggregateRoot.id);
        return object.destroy({ useMasterKey: true });
    }
}
